using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using OpenAI;
using System.ComponentModel;
using System.Text.Json.Serialization;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using System.ComponentModel;
using System.Text.Json.Serialization;
using Azure.AI.Projects;
using Azure.Identity;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.TypeInfoResolverChain.Add(ProverbsAgentSerializerContext.Default));
builder.Services.AddAGUI();

WebApplication app = builder.Build();

// Create the agent factory and map the AG-UI agent endpoint
var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
var jsonOptions = app.Services.GetRequiredService<IOptions<JsonOptions>>();
var agentFactory = new ProverbsAgentFactory(builder.Configuration, loggerFactory, jsonOptions.Value.SerializerOptions);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapAGUI("/", agentFactory.CreateAzureHostedAgent(builder.Configuration));

await app.RunAsync();

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
                instructions: "You are a helpful assistant with access to restaurant information and frontend context. Use any provided context when answering questions about the current page, user, or app state.",         
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
