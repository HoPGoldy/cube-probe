import { AppInstance } from "@/types";
import { User } from "@prisma/client";

export const signJwtToken = (
  server: AppInstance,
  user: {
    id: string;
    username: string;
    role: string;
  },
) => {
  return server.jwt.sign({
    id: user.id,
    username: user.username,
    role: user.role,
  });
};
