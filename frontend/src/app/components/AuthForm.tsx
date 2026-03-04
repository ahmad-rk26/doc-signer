"use client";

import { useState } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ================= SCHEMAS ================= */

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z
            .string()
            .min(6, "Password must be at least 6 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

type FormData = LoginFormData & Partial<RegisterFormData>;

/* ================= PROPS ================= */

type Props = {
    onSubmit: (
        email: string,
        password: string,
        name?: string
    ) => Promise<void>;
    isRegister: boolean;
    onForgotPassword?: () => void;
};

/* ================= COMPONENT ================= */

export default function AuthForm({
    onSubmit,
    isRegister,
    onForgotPassword,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    /* ✅ SINGLE SAFE FORM TYPE */
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(
            isRegister ? registerSchema : loginSchema
        ),
    });

    /* ================= SUBMIT ================= */

    const handleFormSubmit = async (data: FormData) => {
        try {
            if (isRegister) {
                await onSubmit(data.email, data.password, data.name);
            } else {
                await onSubmit(data.email, data.password);
            }
        } catch (error) {
            console.error(error);
        }
    };

    /* helper → fixes ReactNode error */
    const getError = (fieldError: unknown) =>
        fieldError as string;

    /* ================= UI ================= */

    return (
        <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-5"
        >
            {/* NAME */}
            {isRegister && (
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Full Name
                    </label>

                    <input
                        type="text"
                        placeholder="John Doe"
                        {...register("name")}
                        className="w-full px-4 py-3 border rounded-lg"
                        disabled={isSubmitting}
                    />

                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                            {getError(errors.name.message)}
                        </p>
                    )}
                </div>
            )}

            {/* EMAIL */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Email Address
                </label>

                <input
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className="w-full px-4 py-3 border rounded-lg"
                    disabled={isSubmitting}
                />

                {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                        {getError(errors.email.message)}
                    </p>
                )}
            </div>

            {/* PASSWORD */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Password
                </label>

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className="w-full px-4 py-3 border rounded-lg"
                        disabled={isSubmitting}
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        👁
                    </button>
                </div>

                {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                        {getError(errors.password.message)}
                    </p>
                )}
            </div>

            {/* CONFIRM PASSWORD */}
            {isRegister && (
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Confirm Password
                    </label>

                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("confirmPassword")}
                            className="w-full px-4 py-3 border rounded-lg"
                            disabled={isSubmitting}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            👁
                        </button>
                    </div>

                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                            {getError(errors.confirmPassword.message)}
                        </p>
                    )}
                </div>
            )}

            {/* FORGOT PASSWORD */}
            {!isRegister && onForgotPassword && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-sm text-indigo-600"
                    >
                        Forgot password?
                    </button>
                </div>
            )}

            {/* SUBMIT */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
                {isSubmitting
                    ? isRegister
                        ? "Creating account..."
                        : "Signing in..."
                    : isRegister
                        ? "Create Account"
                        : "Sign In"}
            </button>
        </form>
    );
}