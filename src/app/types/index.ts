// Core data types for FarmSmart AI

export interface User {
    id: string;
    kindeId: string;
    name: string;
    email: string;
    role: 'owner' | 'manager' | 'worker';
    points: number;
    level: number;
    achievements: string[];
    createdAt: Date;
  }
  
  export interface Plant {
    id: string;
    userId: string;
    imageUrl: string;
    plantName: string;
    scientificName: string;
    healthStatus: 'healthy' | 'diseased';
    diseases: string[];
    confidence: number;
    size: {
      height: number;
      width: number;
      estimatedArea: number;
    };
    location: string;
    scannedAt: Date;
  }
  
  export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    createdBy: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in-progress' | 'completed';
    points: number;
    dueDate: Date;
    completedAt?: Date;
    plantId?: string;
  }