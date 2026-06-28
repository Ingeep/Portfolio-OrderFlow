namespace OrderFlow.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    public Order Order { get; private set; } = null!;

    //constructor 
    public OrderItem() {}

    public OrderItem(
        Guid productId,
        string productName,
        decimal unitPrice,
        int quantity
    )
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than 0", nameof(quantity));
        if (unitPrice <= 0) throw new ArgumentException("Unit price must be greater than 0", nameof(unitPrice));
        if (string.IsNullOrEmpty(productName)) throw new ArgumentException("Product name cannot be empty", nameof(productName));
        if (productId == Guid.Empty) throw new ArgumentException("Product id cannot be empty", nameof(productId));
        
        Id = Guid.NewGuid();
        ProductId = productId;
        ProductName = productName;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
}