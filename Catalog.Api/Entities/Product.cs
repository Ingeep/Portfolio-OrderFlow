using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Serializers;

using MongoDB.Bson.Serialization.IdGenerators;

namespace Catalog.Api.Entities;

public class StringOrObjectIdSerializer : SerializerBase<string>
{
    public override string Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
    {
        var bsonType = context.Reader.CurrentBsonType;
        if (bsonType == BsonType.ObjectId)
        {
            return context.Reader.ReadObjectId().ToString();
        }
        else if (bsonType == BsonType.String)
        {
            return context.Reader.ReadString();
        }
        else
        {
            throw new BsonSerializationException($"Cannot deserialize string from BsonType {bsonType}");
        }
    }

    public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, string value)
    {
        if (ObjectId.TryParse(value, out var objectId))
        {
            context.Writer.WriteObjectId(objectId);
        }
        else
        {
            context.Writer.WriteString(value);
        }
    }
}

public class Product
{
    [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
    [BsonSerializer(typeof(StringOrObjectIdSerializer))]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;

    public Dictionary<string, string> Attributes { get; set; } = new();
}
