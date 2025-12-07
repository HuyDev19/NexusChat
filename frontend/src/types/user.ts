export interface User {
  _id: string;
  username: string;
  email: string;
  display: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  firstName: string;
  lastName: string;
}
