import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../lib/db";

const router = Router();

// Validation Schemas
const registerSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
});

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

// Register
router.post("/register", async (req: Request, res: Response) => {
    try {
        const { username, password } = registerSchema.parse(req.body);

        const existingUser = await db.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ detail: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "7d" }
        );

        res.json({
            user: { id: user.id, username: user.username },
            accessToken: token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ detail: error.errors });
        }
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        const user = await db.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(400).json({ detail: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ detail: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "7d" }
        );

        res.json({
            user: { id: user.id, username: user.username },
            accessToken: token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ detail: error.errors });
        }
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

export default router;
