/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { getDefaultDashboardRoute, isValidRedirectForRole, UserRole } from "@/lib/authUtils";
import { httpClient } from "@/lib/axios/httpClient";
import { setTokenInCookies } from "@/lib/token.ulits";
import { ApiErrorResponse } from "@/types/api.type";
import { ILoginResponse } from "@/types/auth.type";
import { ILoginPayload, loginZodSchema } from "@/zod/auth.validation";
import { redirect } from "next/navigation";


export const loginAction = async (payload: ILoginPayload, redirectPath?: string): Promise<ILoginResponse | ApiErrorResponse> => {
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

        const {accessToken, refreshToken, token, user} = response.data;
        const {role, emailVerified, needPasswordChange,email } = user;
        await setTokenInCookies("accessToken", accessToken);
        await setTokenInCookies("refreshToken", refreshToken);
        await setTokenInCookies("better-auth.session_token", token);

        if(!emailVerified) {
            redirect("/verify-email");
        }else if(needPasswordChange) {
            redirect(`/reset-password?email=${email}`);
        }else {
            const targetPath = redirectPath && isValidRedirectForRole(redirectPath, role as UserRole) ? redirectPath : getDefaultDashboardRoute(role as UserRole);
            redirect(targetPath);
        }
        

     }catch (error: any) {
        return {
            message: error.message,
            success: false,
        }
     }
    }