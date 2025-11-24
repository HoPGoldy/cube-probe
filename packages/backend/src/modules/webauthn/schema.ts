import { Type } from "typebox";

export const RegisterVerificationRequestSchema = Type.Object({
  credential: Type.Object({
    id: Type.String(),
    rawId: Type.String(),
    response: Type.Object({
      clientDataJSON: Type.String(),
      attestationObject: Type.String(),
      transports: Type.Array(Type.String()),
    }),
    type: Type.Literal("public-key"),
  }),
  credentialName: Type.String(),
});

export const RegisterVerificationResponseSchema = Type.Object({
  verified: Type.Boolean(),
  user: Type.Object({
    id: Type.String(),
    username: Type.String(),
  }),
});

export const LoginOptionsRequestSchema = Type.Object({
  username: Type.String(),
});

export const LoginVerificationRequestSchema = Type.Object({
  credential: Type.Object({
    id: Type.String(),
    rawId: Type.String(),
    response: Type.Object({
      authenticatorData: Type.String(),
      clientDataJSON: Type.String(),
      signature: Type.String(),
      userHandle: Type.String(),
    }),
    type: Type.Literal("public-key"),
  }),
  username: Type.String(),
});

export const LoginVerificationResponseSchema = Type.Object({
  verified: Type.Boolean(),
  token: Type.String(),
});
