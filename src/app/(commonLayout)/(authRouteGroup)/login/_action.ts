/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { httpClient } from "@/lib/axios/httpClient";
import { setTokenInCookie } from "@/lib/token.ulits";
import { ApiErrorResponse } from "@/types/api.type";
import { ILoginResponse } from "@/types/auth.type";
import { ILoginPayload, loginZodSchema } from "@/zod/auth.validation";
import { redirect } from "next/navigation";


export const loginAction = async (payload: ILoginPayload): Promise<ILoginResponse | ApiErrorResponse> => {
    const parsePayload = loginZodSchema.safeParse(payload);
    if (!parsePayload.success) {
        const firstError = parsePayload.error.issues[0].message || "Invalid input";
        return {
            message: firstError,
            success: false,
        }
    }
    try {
        const response = await httpClient.post<ILoginResponse>("/auth/login", payload);

        const { accessToken, refreshToken, token } = response.data;
        await setTokenInCookie("accessToken", accessToken);
        await setTokenInCookie("refreshToken", refreshToken);
        await setTokenInCookie("better-auth.session_token", token, 60 * 60 * 24 );

        redirect("/dashboard");

    } catch (error: any) {
        if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")) {
            throw error;
        }
        return {
            message: error.message,
            success: false,
        }
    }
}