using System.Threading;
using System.Threading.Tasks;

namespace OrderFlow.Application.Common.Interfaces;

public interface IEventBus
{
    Task PublishAsync<T>(T @event, CancellationToken cancellationToken) where T : class;
}
