export interface RequestCreatePropertyNote {
  propertyId: string;
  userId: string;
  noteText: string;
}

export interface ResponsePropertyNoteUser {
  id: string;
  name: string;
  email: string;
}

export interface ResponsePropertyNote {
  id: string;
  propertyId: string;
  userId: string;
  noteText: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  user?: ResponsePropertyNoteUser;
}
