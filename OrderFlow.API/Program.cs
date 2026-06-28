using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using Carter;
using OrderFlow.Application;
using OrderFlow.Infrastructure;
using OrderFlow.Infrastructure.Data;
using Azure.Identity;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();

// Add services to the container.
builder.Services.AddOpenApi();

// Auth and Swagger Configuration
builder.Services.AddSwaggerGen(options => {
    options.SwaggerDoc("v1", new OpenApiInfo{
        Version = "v1",
        Title = "OrderFlow API",
        Description = "API de gestión de pedidos",
        Contact = new OpenApiContact{
            Name = "OrderFlow API"
        }
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme{
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Introduce el token JWT generado en el login de esta forma: Bearer {token}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement{
        {
            new OpenApiSecurityScheme{
                Reference = new OpenApiReference{
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        providerOptions => providerOptions.EnableRetryOnFailure(
            maxRetryCount: 5, 
            maxRetryDelay: TimeSpan.FromSeconds(10), 
            errorNumbersToAdd: null)
    );
});


// Línea 64 (Antes de builder.Build() y delegaciones):
if (!builder.Environment.IsDevelopment()) 
{
    var keyVaultUri = builder.Configuration["AzureKeyVault:Uri"];
    if (!string.IsNullOrEmpty(keyVaultUri)) 
    {
        builder.Configuration.AddAzureKeyVault(
            new Uri(keyVaultUri),
            new DefaultAzureCredential());
    }   
}

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddCarter();

// var jwtSettings = builder.Configuration.GetSection("JwtSettings");
// var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

// builder.Services.AddAuthentication(options => {
//     options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//     options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
// }).AddJwtBearer(options => {
//     options.RequireHttpsMetadata = false;
//     options.SaveToken = true;
//     options.TokenValidationParameters = new TokenValidationParameters{
//         ValidateIssuerSigningKey = true,
//         IssuerSigningKey = new SymmetricSecurityKey(key),
//         ValidateIssuer = true,
//         ValidIssuer = jwtSettings["Issuer"],
//         ValidateAudience = true,
//         ValidAudience = jwtSettings["Audience"],
//         ValidateLifetime = true,
//         ClockSkew = TimeSpan.Zero
//     };
// });

builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd");
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{  
   app.UseSwagger();
   app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapCarter();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

// Ejecutar migraciones automáticamente al iniciar la aplicación en el contenedor de Azure
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
