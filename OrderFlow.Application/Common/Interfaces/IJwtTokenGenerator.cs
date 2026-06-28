namespace OrderFlow.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(string username);
}
