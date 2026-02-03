// Location Service - Business logic for locations

import { prisma } from '@/lib/db/prisma'

/**
 * Location service for queries
 */
export const locationService = {
  /**
   * List all locations
   */
  async list() {
    return prisma.location.findMany({
      orderBy: [
        { buildingName: 'asc' },
        { roomNumber: 'asc' },
      ],
    })
  },

  /**
   * Get location by ID
   */
  async getById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        events: true,
      },
    })
  },

  /**
   * Create a new location
   */
  async create(data: {
    buildingName: string
    roomNumber?: string
    address?: string
    latitude?: number
    longitude?: number
  }) {
    return prisma.location.create({
      data,
    })
  },

  /**
   * Update a location
   */
  async update(id: string, data: Partial<{
    buildingName: string
    roomNumber?: string
    address?: string
    latitude?: number
    longitude?: number
  }>) {
    return prisma.location.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete a location
   */
  async delete(id: string) {
    return prisma.location.delete({
      where: { id },
    })
  },

  /**
   * List all information markets
   */
  async listInfoMarkets() {
    return prisma.informationMarket.findMany({
      orderBy: { name: 'asc' },
    })
  },
}

export default locationService
