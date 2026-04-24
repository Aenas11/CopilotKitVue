using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using OpenAI;
using System.ComponentModel;
using System.Text.Json.Serialization;
using Azure.AI.Projects;
using Azure.Identity;
using System.Text;
using System.Text.Json.Nodes;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.TypeInfoResolverChain.Add(ProverbsAgentSerializerContext.Default));
builder.Services.AddAGUI();

WebApplication app = builder.Build();

app.Use(async (context, next) =>
{
    if (!IsJsonPost(context.Request))
    {
        await next();
        return;
    }

    context.Request.EnableBuffering();

    using StreamReader reader = new(context.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
    string body = await reader.ReadToEndAsync();
    context.Request.Body.Position = 0;

    if (string.IsNullOrWhiteSpace(body))
    {
        await next();
        return;
    }

    JsonNode? rootNode;
    try
    {
        rootNode = JsonNode.Parse(body);
    }
    catch
    {
        await next();
        return;
    }

    if (rootNode is null)
    {
        await next();
        return;
    }

    bool changed = NormalizeContentArrays(rootNode);

    Console.WriteLine($"[NormalizeMiddleware] path={context.Request.Path} changed={changed} bodyLength={body.Length}");

    if (!changed)
    {
        await next();
        return;
    }

    string normalizedBody = rootNode.ToJsonString();
    Console.WriteLine($"[NormalizeMiddleware] normalized body (first 500): {normalizedBody[..Math.Min(500, normalizedBody.Length)]}");
    byte[] normalizedBytes = Encoding.UTF8.GetBytes(normalizedBody);

    context.Request.Body = new MemoryStream(normalizedBytes);
    context.Request.ContentLength = normalizedBytes.Length;

    await next();
});

// Create the agent factory and map the AG-UI agent endpoint
var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
var jsonOptions = app.Services.GetRequiredService<IOptions<JsonOptions>>();
var agentFactory = new ProverbsAgentFactory(builder.Configuration, loggerFactory, jsonOptions.Value.SerializerOptions);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapAGUI("/", agentFactory.CreateAzureHostedAgent(builder.Configuration));

await app.RunAsync();

static bool IsJsonPost(HttpRequest request)
{
    return HttpMethods.IsPost(request.Method)
        && request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true;
}

static string ConvertContentPartsToText(JsonArray parts)
{
    List<string> lines = [];

    foreach (JsonNode? node in parts)
    {
        if (node is not JsonObject part)
        {
            continue;
        }

        string type = part["type"]?.GetValue<string>()?.Trim().ToLowerInvariant() ?? "unknown";

        if (type == "text")
        {
            string? text = part["text"]?.GetValue<string>();
            if (!string.IsNullOrWhiteSpace(text))
            {
                lines.Add(text.Trim());
            }
            continue;
        }

        JsonObject? source = part["source"] as JsonObject;
        JsonObject? metadata = part["metadata"] as JsonObject;

        string filename = metadata?["filename"]?.GetValue<string>() ?? "unknown";
        string mimeType = source?["mimeType"]?.GetValue<string>() ?? "unknown";
        string sourceType = source?["type"]?.GetValue<string>() ?? "unknown";
        string? sourceValue = source?["value"]?.GetValue<string>();

        lines.Add($"[attachment type={type}] filename={filename}, mimeType={mimeType}, source={sourceType}");

        if (string.Equals(sourceType, "url", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(sourceValue))
        {
            lines.Add($"attachment_url={sourceValue}");
            lines.Add("[/attachment]");
            continue;
        }

        if (!string.IsNullOrWhiteSpace(sourceValue))
        {
            lines.Add($"attachment_data_base64_length={sourceValue.Length}");
            lines.Add("attachment_data_base64_start");
            lines.Add(TruncateAttachmentPayload(sourceValue));
            lines.Add("attachment_data_base64_end");
        }

        lines.Add("[/attachment]");
    }

    return string.Join("\n", lines);
}

static string TruncateAttachmentPayload(string payload)
{
    const int MaxChars = 24000;
    if (payload.Length <= MaxChars)
    {
        return payload;
    }

    int omitted = payload.Length - MaxChars;
    return payload[..MaxChars] + $"\n[truncated {omitted} chars]";
}

static bool NormalizeContentArrays(JsonNode node)
{
    bool changed = false;

    if (node is JsonObject obj)
    {
        if (obj["content"] is JsonArray contentParts)
        {
            obj["content"] = ConvertContentPartsToText(contentParts);
            changed = true;
        }

        foreach ((string _, JsonNode? child) in obj)
        {
            if (child is null)
            {
                continue;
            }

            changed = NormalizeContentArrays(child) || changed;
        }
    }
    else if (node is JsonArray arr)
    {
        for (int i = 0; i < arr.Count; i++)
        {
            JsonNode? child = arr[i];
            if (child is null)
            {
                continue;
            }

            changed = NormalizeContentArrays(child) || changed;
        }
    }

    return changed;
}

// =================
// State Management
// =================
public class ProverbsState
{
    public List<string> Proverbs { get; set; } = [];
}

// =================
// Agent Factory
// =================
public class ProverbsAgentFactory
{
    private readonly IConfiguration _configuration;
    private readonly ProverbsState _state;    
    private readonly ILogger _logger;
    private readonly System.Text.Json.JsonSerializerOptions _jsonSerializerOptions;

    public ProverbsAgentFactory(IConfiguration configuration, ILoggerFactory loggerFactory, System.Text.Json.JsonSerializerOptions jsonSerializerOptions)
    {
        _configuration = configuration;
        _state = new();
        _logger = loggerFactory.CreateLogger<ProverbsAgentFactory>();
        _jsonSerializerOptions = jsonSerializerOptions;

    }



public AIAgent CreateAzureHostedAgent(ConfigurationManager configurationManager)
    {
                string endpoint = configurationManager["AZURE_OPENAI_ENDPOINT"]
            ?? throw new InvalidOperationException("AZURE_OPENAI_ENDPOINT is not set.");
        string deploymentName = configurationManager["AZURE_OPENAI_DEPLOYMENT_NAME"]
            ?? throw new InvalidOperationException("AZURE_OPENAI_DEPLOYMENT_NAME is not set.");


            

        // Create the AI agent with tools
        AIAgent agent = new AIProjectClient(
                new Uri(endpoint),
                new DefaultAzureCredential())
                //add interceptor to log requests and responses                
            .AsAIAgent(
                model: deploymentName,
                name: "AGUIAssistant",
                instructions: "You are a helpful assistant with access to restaurant information and frontend context. Use any provided context when answering questions about the current page, user, or app state. " +
                    "You may also have access to a frontend-provided tool named request_user_approval. " +
                    "Before taking a sensitive or customer-affecting action such as issuing a refund, changing a plan, escalating a ticket, deleting records, or sending a message on the user's behalf, you must call request_user_approval first. " +
                    "When you call it, provide a short plain-English message that describes the exact action and include concise context when it helps the operator decide. " +
                    "If the tool returns approved=true, confirm in one short sentence that you will proceed. If approved=false, acknowledge that the action was not approved and include the reason when one is given.",         
                tools: [
                    AIFunctionFactory.Create(
                        method: GetProverbs,
                        name: "GetProverbs",
                        description: "Get the current list of proverbs.")
                    ,
                    AIFunctionFactory.Create(
                        method: AddProverbs,
                        name: "AddProverbs",
                        description: "Add new proverbs to the list."
                        )
                    ,
                    AIFunctionFactory.Create(
                        method: SetProverbs,
                        name: "SetProverbs",
                        description: "Replace the entire list of proverbs."
                        ),
                    AIFunctionFactory.Create(
                        method: GetWeather,
                        name: "GetWeather",
                        description: "Get the weather for a given location. Ensure location is fully spelled out."
                        )

                ]);


                

        return new SharedStateAgent(agent, _jsonSerializerOptions);
            
    }


    // =================
    // Tools
    // =================

    [Description("Get the current list of proverbs.")]
    private List<string> GetProverbs()
    {
        _logger.LogInformation("📖 Getting proverbs: {Proverbs}", string.Join(", ", _state.Proverbs));
        return _state.Proverbs;
    }

    [Description("Add new proverbs to the list.")]
    private void AddProverbs([Description("The proverbs to add")] List<string> proverbs)
    {
        _logger.LogInformation("➕ Adding proverbs: {Proverbs}", string.Join(", ", proverbs));
        _state.Proverbs.AddRange(proverbs);
    }

    [Description("Replace the entire list of proverbs.")]
    private void SetProverbs([Description("The new list of proverbs")] List<string> proverbs)
    {
        _logger.LogInformation("📝 Setting proverbs: {Proverbs}", string.Join(", ", proverbs));
        _state.Proverbs = [.. proverbs];
    }

    [Description("Get the weather for a given location. Ensure location is fully spelled out.")]
    private WeatherInfo GetWeather([Description("The location to get the weather for")] string location)
    {
        _logger.LogInformation("🌤️  Getting weather for: {Location}", location);
        return new()
        {
            Temperature = 20,
            Conditions = "sunny",
            Humidity = 50,
            WindSpeed = 10,
            FeelsLike = 25
        };
    }
}

// =================
// Data Models
// =================

public class AppStateSnapshot
{
    [JsonPropertyName("currentPage")]
    public string CurrentPage { get; set; } = string.Empty;

    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("proverbs")]
    public List<string> Proverbs { get; set; } = [];
}

public class WeatherInfo
{
    [JsonPropertyName("temperature")]
    public int Temperature { get; init; }

    [JsonPropertyName("conditions")]
    public string Conditions { get; init; } = string.Empty;

    [JsonPropertyName("humidity")]
    public int Humidity { get; init; }

    [JsonPropertyName("wind_speed")]
    public int WindSpeed { get; init; }

    [JsonPropertyName("feelsLike")]
    public int FeelsLike { get; init; }
}

public partial class Program { }

// =================
// Serializer Context
// =================
[JsonSerializable(typeof(AppStateSnapshot))]
[JsonSerializable(typeof(WeatherInfo))]
internal sealed partial class ProverbsAgentSerializerContext : JsonSerializerContext;
