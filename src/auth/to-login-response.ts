import type { LoginResponse } from "@auto-lincoln/contracts";
import type { User } from "../db/generated/prisma/client.js";

export function toLoginResponse(user: User): LoginResponse {
    return {
        id: user.id,
        email: user.email,
        name: user.displayName
    }
}