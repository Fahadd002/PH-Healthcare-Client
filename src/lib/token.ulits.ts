"use server";

import jwt from "jsonwebtoken";
import { setCookie } from "./cookie.utils";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET

const getTokenSecondsRemaining = (token: string): number => {
    if (!token) return 0;

    try {
        const tokaenPaload = JWT_ACCESS_SECRET ? jwt.verify(token, JWT_ACCESS_SECRET) as jwt.JwtPayload : jwt.decode(token) as jwt.JwtPayload;
        if (!tokaenPaload || !tokaenPaload.exp) return 0;
        const remainingSeconds = tokaenPaload.exp as number - Math.floor(Date.now() / 1000);
        return remainingSeconds > 0 ? remainingSeconds : 0;
    }
    catch (error) {
        console.error("Error parsing token:", error);
        return 0;
    }
}

export const setTokenInCookie =  async (name: string, token: string, fallbackMaxAge: number = 60 * 60 * 24) => {
    const maxAgeInSeconds = getTokenSecondsRemaining(token);
    await setCookie(name, token, maxAgeInSeconds || fallbackMaxAge);
}