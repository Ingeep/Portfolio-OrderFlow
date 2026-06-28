using System;

namespace OrderFlow.Application.Common.Events;

public record OrderPlacedEvent(Guid OrderId, string CustomerEmail, decimal TotalAmount);