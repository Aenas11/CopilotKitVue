using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Collections;
using System.Reflection;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

internal sealed class SharedStateAgent : DelegatingAIAgent
{
    private readonly JsonSerializerOptions _jsonSerializerOptions;

    public SharedStateAgent(AIAgent innerAgent, JsonSerializerOptions jsonSerializerOptions)
        : base(innerAgent)
    {
        this._jsonSerializerOptions = jsonSerializerOptions;
    }

    protected override Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return this.RunStreamingAsync(messages, session, options, cancellationToken)
            .ToAgentResponseAsync(cancellationToken);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ChatMessage? contextMessage = CreateContextMessage(options);
        IEnumerable<ChatMessage> contextAwareMessages = contextMessage is null
            ? messages
            : messages.Prepend(contextMessage);

        // Check if the client sent state in the request
        if (options is not ChatClientAgentRunOptions { ChatOptions.AdditionalProperties: { } properties } chatRunOptions ||
            !properties.TryGetValue("ag_ui_state", out object? stateObj) ||
            stateObj is not JsonElement state ||
            state.ValueKind != JsonValueKind.Object)
        {
            // No state management requested, pass through to inner agent
            await foreach (var update in this.InnerAgent.RunStreamingAsync(contextAwareMessages, session, options, cancellationToken).ConfigureAwait(false))
            {
                yield return update;
            }
            yield break;
        }

        // Check if state has properties (not empty {})
        bool hasProperties = false;
        foreach (JsonProperty _ in state.EnumerateObject())
        {
            hasProperties = true;
            break;
        }

        if (!hasProperties)
        {
            // Empty state - treat as no state
            await foreach (var update in this.InnerAgent.RunStreamingAsync(messages, session, options, cancellationToken).ConfigureAwait(false))
            {
                yield return update;
            }
            yield break;
        }

        // First run: Generate structured state update
        var firstRunOptions = new ChatClientAgentRunOptions
        {
            ChatOptions = chatRunOptions.ChatOptions.Clone(),
            AllowBackgroundResponses = chatRunOptions.AllowBackgroundResponses,
           // ContinuationToken = chatRunOptions.ContinuationToken,
            ChatClientFactory = chatRunOptions.ChatClientFactory,
        };

        // Configure JSON schema response format for structured state output
        firstRunOptions.ChatOptions.ResponseFormat = ChatResponseFormat.ForJsonSchema<ProverbsStateSnapshot>(
            schemaName: "ProverbsStateSnapshot",
            schemaDescription: "A response containing the current list of proverbs");

        // Add current state to the conversation - state is already a JsonElement
        ChatMessage stateUpdateMessage = new(
            ChatRole.System,
            [
                new TextContent("Here is the current state in JSON format:"),
                new TextContent(JsonSerializer.Serialize(state, this._jsonSerializerOptions.GetTypeInfo(typeof(JsonElement)))),
                new TextContent("The new state is:")
            ]);

        var firstRunMessages = contextAwareMessages.Append(stateUpdateMessage);

        // Collect all updates from first run
        var allUpdates = new List<AgentResponseUpdate>();
        await foreach (var update in this.InnerAgent.RunStreamingAsync(firstRunMessages, session, firstRunOptions, cancellationToken).ConfigureAwait(false))
        {
            allUpdates.Add(update);

            // Yield all non-text updates (tool calls, etc.)
            bool hasNonTextContent = update.Contents.Any(c => c is not TextContent);
            if (hasNonTextContent)
            {
                yield return update;
            }
        }

        var response = allUpdates.ToAgentResponse();

        // Try to deserialize the structured state response
        JsonElement stateSnapshot;
        try
        {
            stateSnapshot = JsonSerializer.Deserialize<JsonElement>(response.Text, this._jsonSerializerOptions);
        }
        catch (JsonException)
        {
            yield break;
        }

        // Serialize and emit as STATE_SNAPSHOT via DataContent
        byte[] stateBytes = JsonSerializer.SerializeToUtf8Bytes(
            stateSnapshot,
            this._jsonSerializerOptions.GetTypeInfo(typeof(JsonElement)));
        yield return new AgentResponseUpdate
        {
            Contents = [new DataContent(stateBytes, "application/json")]
        };

        // Second run: Generate user-friendly summary
        var secondRunMessages = contextAwareMessages.Concat(response.Messages).Append(
            new ChatMessage(
                ChatRole.System,
                [new TextContent("Please provide a concise summary of the state changes in at most two sentences.")]));

        await foreach (var update in this.InnerAgent.RunStreamingAsync(secondRunMessages, session, options, cancellationToken).ConfigureAwait(false))
        {
            yield return update;
        }
    }

    private ChatMessage? CreateContextMessage(AgentRunOptions? options)
    {
        if (options is not ChatClientAgentRunOptions chatRunOptions)
        {
            return null;
        }

        object? context = TryGetRuntimeContext(chatRunOptions);
        if (context is null)
        {
            return null;
        }

        string contextText = FormatContext(context);
        if (string.IsNullOrWhiteSpace(contextText))
        {
            return null;
        }

        return new ChatMessage(
            ChatRole.System,
            [
                new TextContent("Frontend context available to this run:"),
                new TextContent(contextText),
                new TextContent("Use this context when it is relevant to the user's request.")
            ]);
    }

    private object? TryGetRuntimeContext(ChatClientAgentRunOptions chatRunOptions)
    {
        object? chatOptions = chatRunOptions.ChatOptions;
        if (chatOptions is null)
        {
            return null;
        }

        object? additionalProperties = GetPropertyValue(chatOptions, "AdditionalProperties");
        object? context = TryGetAdditionalPropertyValue(additionalProperties, "context", "ag_ui_context", "conversationContext");
        if (context is not null)
        {
            return context;
        }

        context = GetPropertyValue(chatOptions, "Context");
        if (context is not null)
        {
            return context;
        }

        return GetPropertyValue(chatOptions, "AgUiContext");
    }

    private static object? GetPropertyValue(object target, string propertyName)
    {
        PropertyInfo? property = target.GetType().GetProperty(
            propertyName,
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
        return property?.GetValue(target);
    }

    private static object? TryGetAdditionalPropertyValue(object? additionalProperties, params string[] keys)
    {
        if (additionalProperties is null)
        {
            return null;
        }

        if (additionalProperties is IDictionary<string, object?> typedDictionary)
        {
            foreach (string key in keys)
            {
                if (typedDictionary.TryGetValue(key, out object? value))
                {
                    return value;
                }
            }
        }

        if (additionalProperties is IReadOnlyDictionary<string, object?> readOnlyDictionary)
        {
            foreach (string key in keys)
            {
                if (readOnlyDictionary.TryGetValue(key, out object? value))
                {
                    return value;
                }
            }
        }

        if (additionalProperties is IDictionary dictionary)
        {
            foreach (string key in keys)
            {
                if (dictionary.Contains(key))
                {
                    return dictionary[key];
                }
            }
        }

        if (additionalProperties is IEnumerable enumerable)
        {
            foreach (object? entry in enumerable)
            {
                if (entry is null)
                {
                    continue;
                }

                object? entryKey = GetPropertyValue(entry, "Key");
                object? entryValue = GetPropertyValue(entry, "Value");
                if (entryKey is string key && keys.Contains(key, StringComparer.OrdinalIgnoreCase))
                {
                    return entryValue;
                }
            }
        }

        return null;
    }

    private string FormatContext(object context)
    {
        if (context is JsonElement jsonElement)
        {
            return jsonElement.GetRawText();
        }

        if (context is IEnumerable enumerable and not string)
        {
            List<string> entries = [];

            foreach (object? item in enumerable)
            {
                if (item is null)
                {
                    continue;
                }

                if (item is JsonElement itemElement && itemElement.ValueKind is JsonValueKind.Object)
                {
                    string? description = TryReadJsonElementProperty(itemElement, "description");
                    string? value = TryReadJsonElementProperty(itemElement, "value");
                    if (!string.IsNullOrWhiteSpace(description) && !string.IsNullOrWhiteSpace(value))
                    {
                        entries.Add($"- {description}: {value}");
                        continue;
                    }
                }

                string? reflectedDescription = GetStringPropertyValue(item, "Description");
                string? reflectedValue = GetStringPropertyValue(item, "Value");
                if (!string.IsNullOrWhiteSpace(reflectedDescription) && !string.IsNullOrWhiteSpace(reflectedValue))
                {
                    entries.Add($"- {reflectedDescription}: {reflectedValue}");
                    continue;
                }

                entries.Add($"- {JsonSerializer.Serialize(item, this._jsonSerializerOptions)}");
            }

            if (entries.Count > 0)
            {
                return string.Join(Environment.NewLine, entries);
            }
        }

        return JsonSerializer.Serialize(context, this._jsonSerializerOptions);
    }

    private static string? GetStringPropertyValue(object target, string propertyName)
    {
        object? value = GetPropertyValue(target, propertyName);
        return value?.ToString();
    }

    private static string? TryReadJsonElementProperty(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property))
        {
            return null;
        }

        return property.ValueKind switch
        {
            JsonValueKind.String => property.GetString(),
            JsonValueKind.Number => property.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => null,
            _ => property.GetRawText(),
        };
    }
}