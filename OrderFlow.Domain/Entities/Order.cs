namespace OrderFlow.Domain.Entities;

public class Order
{
   public Guid Id { get; private set; }
   public string CustomerEmail { get; private set; } = string.Empty; 
   public DateTime CreatedAt { get; private set; }
   public string Status { get; private set; } = "Pending"; 


    // Lista encapsulada (Backing Field) para proteger la colección. 
    // Nadie de afuera puede hacer un .Add() directo sin pasar por el método AddOrderItem.
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    public decimal TotalAmount => Items.Sum(item => item.UnitPrice * item.Quantity);

   public Order() {} // Para EF Core

   public Order(
        string customerEmail
    )
   {
        if (string.IsNullOrEmpty(customerEmail)) throw new ArgumentException("Customer email cannot be empty", nameof(customerEmail));
     //    if (items == null || items.Count == 0) throw new ArgumentException("Items cannot be null or empty", nameof(items));

        Id = Guid.NewGuid();
        CustomerEmail = customerEmail;
        CreatedAt = DateTime.UtcNow;
   }

   public void AddOrderItem(
        Guid productId,
        string productName,
        decimal unitPrice,
        int quantity
    )
   {
        // Regla de negocio: Si ya existe el producto en el pedido, sumamos la cantidad.
        var existingItem = _items.FirstOrDefault(x => x.ProductId == productId);
        if(existingItem != null)
        {
             // Nota: En un diseño de producción, actualizarías la cantidad internamente en OrderItem.
             // En este ejemplo simple, si cambias el precio, el total se recalcula automáticamente por el getter computado.
             _items.Remove(existingItem);
             _items.Add(new OrderItem(productId, productName, unitPrice, existingItem.Quantity + quantity));
        }
        else
        {
            _items.Add(new OrderItem(productId, productName, unitPrice, quantity));
        }
   }

   public void CompleteOrder()
   {
        if(Status != "Pending") throw new InvalidOperationException("Only pending orders can be completed");
        Status = "Completed";
   }
}
