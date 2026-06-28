namespace OrderFlow.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public decimal Price { get; private set; }

    public Product() { }

    public Product(string name, decimal price)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name cannot be null or empty", nameof(name));
        if (price <= 0) throw new ArgumentException("Price must be greater than 0", nameof(price));

        Id = Guid.NewGuid();
        Name = name;
        Price = price;
    }

    public void Update(string name, decimal price)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name cannot be null or empty", nameof(name));
        if (price <= 0) throw new ArgumentException("Price must be greater than 0", nameof(price));

        Name = name;
        Price = price;
    }
}
