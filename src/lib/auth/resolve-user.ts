import type { User } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

type AuthErrorCode = "auth/missing-token" | "auth/invalid-token";

export class AuthError extends Error {
  status: number;
  code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode, status = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

const getAuthorizationHeader = (request?: Request) =>
  request ? request.headers.get("authorization") : headers().get("authorization");

export const resolveAuthenticatedUser = async (
  request?: Request,
): Promise<User> => {
  const authHeader = getAuthorizationHeader(request);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing auth token.", "auth/missing-token");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new AuthError("Missing auth token.", "auth/missing-token");
  }

  let decodedToken;
  try {
    decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
  } catch {
    throw new AuthError("Invalid auth token.", "auth/invalid-token");
  }

  const firebaseUid = decodedToken?.uid;
  if (!firebaseUid) {
    throw new AuthError("Invalid auth token.", "auth/invalid-token");
  }

  return prisma.user.upsert({
    where: { firebaseUid },
    update: {},
    create: { firebaseUid },
  });
};
