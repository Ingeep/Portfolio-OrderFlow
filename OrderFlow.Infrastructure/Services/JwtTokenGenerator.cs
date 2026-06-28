using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using OrderFlow.Application.Common.Interfaces;

namespace OrderFlow.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
   private readonly IConfiguration _config;

   public JwtTokenGenerator(IConfiguration config)
   {
      _config = config;
   }

   public string GenerateToken(string username)
   {
      var jwtSettings = _config.GetSection("JwtSettings");
      var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

      var tokenDescriptor = new SecurityTokenDescriptor
      {
         Subject = new ClaimsIdentity(new[]
         {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, "Admin")
         }),
         Expires = DateTime.UtcNow.AddDays(1),
         Issuer = jwtSettings["Issuer"],
         Audience = jwtSettings["Audience"],
         SigningCredentials = new SigningCredentials(
          new SymmetricSecurityKey(key),
          SecurityAlgorithms.HmacSha256Signature
        )
      };

      var tokenHandler = new JwtSecurityTokenHandler();
      var token = tokenHandler.CreateToken(tokenDescriptor);
      return tokenHandler.WriteToken(token);
   }

}
