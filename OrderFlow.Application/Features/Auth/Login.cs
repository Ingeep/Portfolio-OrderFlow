using MediatR;
using System.Threading;
using System.Threading.Tasks;
using OrderFlow.Application.Common.Interfaces;

namespace OrderFlow.Application.Features.Auth;

public record LoginRequest(string Username, string Password) : IRequest<string>;

public class LoginHandler : IRequestHandler<LoginRequest, string>
{
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginHandler(IJwtTokenGenerator jwtTokenGenerator)
    {
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public Task<string> Handle(LoginRequest request, CancellationToken cancellationToken)
    {
        // En una app real, aquí validarías el usuario y contraseña contra la BD.
        // Como es educativo, asumiremos que las credenciales son válidas y generamos el Token.
        var token = _jwtTokenGenerator.GenerateToken(request.Username);
        return Task.FromResult(token);
    }
}
