export type { Fabric } from './types'
import { kv } from './kv'
import type { Fabric } from './types'

export const fabricSeedData: Omit<Fabric, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Emerald Green Velvet',
    description: 'A rich, luxurious velvet fabric in a deep emerald green. Perfect for elegant apparel and upholstery.',
    price: 45.50,
    category: 'Velvet',
    imageUrl: '/emerald-green-velvet.png',
    featured: true,
  },
  {
    name: 'Natural Linen',
    description: 'A breathable and durable linen fabric with a natural, earthy tone. Ideal for summer clothing and home textiles.',
    price: 28.00,
    category: 'Linen',
    imageUrl: '/natural-linen-fabric.png',
    featured: false,
  },
];

export async function seedFabrics() {
  console.log('Checking for KV environment variables...');
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.log("KV environment variables not set, skipping fabric seeding.");
    return {
      error: "KV environment variables not set.",
    };
  }
  console.log('KV environment variables found. Seeding fabrics...');

  try {
    const pipeline = kv.pipeline();
    fabricSeedData.forEach(fabric => {
      const id = `fabric_${fabric.name.toLowerCase().replace(/\s+/g, '_')}`;
      const newFabric: Fabric = {
        ...fabric,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      pipeline.hset('fabrics', { [id]: newFabric });
      console.log(`Pipelined fabric for seeding: ${newFabric.name}`);
    });

    await pipeline.exec();
    console.log('Fabric data seeded successfully.');
    return {
      message: 'Fabric data seeded successfully.'
    };
  } catch (error) {
    console.error('Error seeding fabrics:', error);
    return {
      error: 'Failed to seed fabrics.'
    };
  }
}
