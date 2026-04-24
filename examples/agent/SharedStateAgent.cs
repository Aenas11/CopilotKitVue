using System.Net.Http;
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
        IEnumerable<ChatMessage> rehydratedMessages = await RehydrateAttachmentsAsync(messages);
        IEnumerable<ChatMessage> contextAwareMessages = contextMessage is null
            ? rehydratedMessages
            : rehydratedMessages.Prepend(contextMessage);

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
            await foreach (var update in this.InnerAgent.RunStreamingAsync(rehydratedMessages, session, options, cancellationToken).ConfigureAwait(false))
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
            ChatClientFactory = chatRunOptions.ChatClientFactory,
        };

        // Configure JSON schema response format for structured state output
        firstRunOptions.ChatOptions.ResponseFormat = ChatResponseFormat.ForJsonSchema<AppStateSnapshot>(
            schemaName: "AppStateSnapshot",
            schemaDescription: "A response containing the current application state, including currentPage, userName, and any proverbs.");

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

        // Second run: Generate user-friendly summary grounded in the resolved state snapshot.
        ChatMessage latestStateMessage = new(
            ChatRole.System,
            [
                new TextContent("Use this latest application state JSON when answering the user:"),
                new TextContent(JsonSerializer.Serialize(stateSnapshot, this._jsonSerializerOptions.GetTypeInfo(typeof(JsonElement))))
            ]);

        var secondRunMessages = contextAwareMessages
            .Concat(response.Messages)
            .Append(latestStateMessage)
            .Append(
                new ChatMessage(
                    ChatRole.System,
                    [new TextContent("Please answer the user's request using the latest application state in at most two sentences. If the user asks about their current page, username, or app state, report those values directly. If state changed, mention the relevant change concisely.")])) ;

        await foreach (var update in this.InnerAgent.RunStreamingAsync(secondRunMessages, session, options, cancellationToken).ConfigureAwait(false))
        {
            yield return update;
        }
    }

    private ChatMessage? CreateContextMessage(AgentRunOptions? options)
    {
        object? context = TryGetRuntimeContext(options);
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

    private object? TryGetRuntimeContext(AgentRunOptions? runOptions)
    {
        if (runOptions is null)
        {
            return null;
        }

        // Some runtimes expose context directly on run options.
        object? directContext = GetPropertyValue(runOptions, "Context")
            ?? GetPropertyValue(runOptions, "AgUiContext");
        if (directContext is not null)
        {
            return directContext;
        }

        object? runAdditionalProperties = GetPropertyValue(runOptions, "AdditionalProperties");
        object? additionalContext = TryGetAdditionalPropertyValue(
            runAdditionalProperties,
            "context",
            "ag_ui_context",
            "conversationContext");
        if (additionalContext is not null)
        {
            return additionalContext;
        }

        // ChatClientAgentRunOptions exposes nested ChatOptions where context often lives.
        object? chatOptions = runOptions is ChatClientAgentRunOptions chatRunOptions
            ? chatRunOptions.ChatOptions
            : GetPropertyValue(runOptions, "ChatOptions");
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

        context = GetPropertyValue(chatOptions, "AgUiContext");
        if (context is not null)
        {
            return context;
        }

        // Final fallback: recursively inspect the whole options object for context-shaped data.
        return FindContextRecursively(runOptions, 0, new HashSet<object>(ReferenceEqualityComparer.Instance));
    }

    private static readonly string[] ContextKeys =
    [
        "context",
        "ag_ui_context",
        "conversationContext",
        "frontendContext",
        "frontend_context"
    ];

    private object? FindContextRecursively(object? value, int depth, HashSet<object> visited)
    {
        if (value is null || depth > 6)
        {
            return null;
        }

        if (value is string)
        {
            return null;
        }

        if (value.GetType().IsClass)
        {
            if (!visited.Add(value))
            {
                return null;
            }
        }

        if (value is JsonElement element)
        {
            return FindContextInJsonElement(element, depth, visited);
        }

        object? direct = TryGetAdditionalPropertyValue(value, ContextKeys);
        if (direct is not null)
        {
            return direct;
        }

        foreach (string propertyName in ContextKeys)
        {
            object? propertyValue = GetPropertyValue(value, propertyName);
            if (propertyValue is not null)
            {
                return propertyValue;
            }
        }

        if (value is IEnumerable enumerable)
        {
            foreach (object? item in enumerable)
            {
                object? nested = FindContextRecursively(item, depth + 1, visited);
                if (nested is not null)
                {
                    return nested;
                }
            }

            return null;
        }

        PropertyInfo[] properties = value.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public);
        foreach (PropertyInfo property in properties)
        {
            if (property.GetIndexParameters().Length > 0)
            {
                continue;
            }

            object? nestedValue;
            try
            {
                nestedValue = property.GetValue(value);
            }
            catch
            {
                continue;
            }

            object? nestedContext = FindContextRecursively(nestedValue, depth + 1, visited);
            if (nestedContext is not null)
            {
                return nestedContext;
            }
        }

        return null;
    }

    private object? FindContextInJsonElement(JsonElement element, int depth, HashSet<object> visited)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (string key in ContextKeys)
            {
                foreach (JsonProperty property in element.EnumerateObject())
                {
                    if (string.Equals(property.Name, key, StringComparison.OrdinalIgnoreCase))
                    {
                        return property.Value;
                    }
                }
            }

            foreach (JsonProperty property in element.EnumerateObject())
            {
                object? nested = FindContextInJsonElement(property.Value, depth + 1, visited);
                if (nested is not null)
                {
                    return nested;
                }
            }
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement item in element.EnumerateArray())
            {
                object? nested = FindContextInJsonElement(item, depth + 1, visited);
                if (nested is not null)
                {
                    return nested;
                }
            }
        }

        return null;
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

        if (additionalProperties is JsonElement additionalJson)
        {
            if (additionalJson.ValueKind == JsonValueKind.Object)
            {
                foreach (string key in keys)
                {
                    foreach (JsonProperty property in additionalJson.EnumerateObject())
                    {
                        if (string.Equals(property.Name, key, StringComparison.OrdinalIgnoreCase))
                        {
                            return property.Value;
                        }
                    }
                }
            }

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
                    string? description = TryReadJsonElementProperty(itemElement, "description")
                        ?? TryReadJsonElementProperty(itemElement, "key");
                    string? value = TryReadJsonElementProperty(itemElement, "value");
                    if (!string.IsNullOrWhiteSpace(description) && !string.IsNullOrWhiteSpace(value))
                    {
                        entries.Add($"- {description}: {value}");
                        continue;
                    }
                }

                string? reflectedDescription = GetStringPropertyValue(item, "Description")
                    ?? GetStringPropertyValue(item, "Key");
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

    // Parses the text-encoded attachment format produced by the request-normalization middleware
    // and reconstructs proper DataContent items so the LLM receives images via the vision API.
    private static async Task<IEnumerable<ChatMessage>> RehydrateAttachmentsAsync(IEnumerable<ChatMessage> messages)
    {
        List<ChatMessage> result = [];
        foreach (ChatMessage message in messages)
        {
            if (message.Role != ChatRole.User)
            {
                result.Add(message);
                continue;
            }

            bool hasAttachments = message.Contents
                .OfType<TextContent>()
                .Any(tc => tc.Text?.Contains("[attachment type=", StringComparison.Ordinal) == true);

            if (!hasAttachments)
            {
                result.Add(message);
                continue;
            }

            List<AIContent> newContents = [];
            foreach (AIContent content in message.Contents)
            {
                if (content is TextContent textContent &&
                    textContent.Text?.Contains("[attachment type=", StringComparison.Ordinal) == true)
                {
                    newContents.AddRange(await ParseAttachmentTextAsync(textContent.Text));
                }
                else
                {
                    newContents.Add(content);
                }
            }

            result.Add(new ChatMessage(message.Role, newContents));
        }
        return result;
    }

    private static async Task<List<AIContent>> ParseAttachmentTextAsync(string text)
    {
        const string AttachOpen = "[attachment type=";
        const string AttachClose = "[/attachment]";
        const string B64Start = "attachment_data_base64_start\n";
        const string B64End = "\nattachment_data_base64_end";

        List<AIContent> result = [];
        int pos = 0;

        while (pos < text.Length)
        {
            int attachStart = text.IndexOf(AttachOpen, pos, StringComparison.Ordinal);
            if (attachStart == -1)
            {
                string remaining = text[pos..].Trim();
                if (!string.IsNullOrWhiteSpace(remaining))
                    result.Add(new TextContent(remaining));
                break;
            }

            string before = text[pos..attachStart].Trim();
            if (!string.IsNullOrWhiteSpace(before))
                result.Add(new TextContent(before));

            int attachEnd = text.IndexOf(AttachClose, attachStart, StringComparison.Ordinal);
            if (attachEnd == -1)
            {
                result.Add(new TextContent(text[attachStart..]));
                break;
            }

            string block = text[attachStart..(attachEnd + AttachClose.Length)];

            // Extract mimeType from header line
            string? mimeType = null;
            int mimeIdx = block.IndexOf("mimeType=", StringComparison.Ordinal);
            if (mimeIdx != -1)
            {
                int mimeStart = mimeIdx + "mimeType=".Length;
                int mimeEnd = block.IndexOfAny([',', '\n'], mimeStart);
                mimeType = mimeEnd == -1 ? block[mimeStart..].Trim() : block[mimeStart..mimeEnd].Trim();
            }

            // Try to extract base64 image/document data
            int b64StartIdx = block.IndexOf(B64Start, StringComparison.Ordinal);
            int b64EndIdx = block.IndexOf(B64End, StringComparison.Ordinal);
            if (b64StartIdx != -1 && b64EndIdx != -1)
            {
                int dataStart = b64StartIdx + B64Start.Length;
                string base64 = block[dataStart..b64EndIdx];

                // Remove truncation marker added by TruncateAttachmentPayload
                int truncIdx = base64.IndexOf("\n[truncated ", StringComparison.Ordinal);
                if (truncIdx != -1)
                    base64 = base64[..truncIdx];

                try
                {
                    byte[] bytes = Convert.FromBase64String(base64.Trim());
                    result.Add(new DataContent(bytes, mimeType ?? "application/octet-stream"));
                }
                catch
                {
                    // Malformed base64 — fall back to raw text block
                    result.Add(new TextContent(block));
                }
            }
            else
            {
                // URL attachment
                int urlIdx = block.IndexOf("attachment_url=", StringComparison.Ordinal);
                if (urlIdx != -1)
                {
                    int urlStart = urlIdx + "attachment_url=".Length;
                    int urlEnd = block.IndexOf('\n', urlStart);
                    string url = urlEnd == -1 ? block[urlStart..].Trim() : block[urlStart..urlEnd].Trim();

                    if (Uri.TryCreate(url, UriKind.Absolute, out Uri? uri) &&
                        (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
                    {
                        // Fetch the remote URL and rehydrate as binary DataContent
                        try
                        {
                            using HttpClient http = new();
                            byte[] bytes = await http.GetByteArrayAsync(uri);
                            result.Add(new DataContent(bytes, mimeType ?? "application/octet-stream"));
                        }
                        catch
                        {
                            // Network fetch failed — pass URL as text so the LLM knows about it
                            result.Add(new TextContent($"[Attachment URL: {url}]"));
                        }
                    }
                    else
                    {
                        result.Add(new TextContent($"[Attachment URL: {url}]"));
                    }
                }
                else
                {
                    result.Add(new TextContent(block));
                }
            }

            pos = attachEnd + AttachClose.Length;
        }

        return result;
    }

}