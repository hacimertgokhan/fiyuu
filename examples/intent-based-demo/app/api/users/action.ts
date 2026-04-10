/**
 * app/api/users/action.ts → Route: /api/users/action
 * 
 * Form submission handler
 */

import { defineAction } from "@fiyuu/core";
import { z } from "zod";

export default defineAction({
  // Route YOK! Dosya path'inden: /api/users/action
  
  name: "createUser",
  
  fields: {
    name: {
      type: "text",
      label: "İsim",
      required: true,
      validate: z.string().min(2),
    },
    email: {
      type: "email",
      label: "Email",
      required: true,
      validate: z.string().email(),
    },
    role: {
      type: "select",
      label: "Rol",
      required: true,
      options: [
        { value: "user", label: "Kullanıcı" },
        { value: "admin", label: "Admin" },
      ],
    },
  },
  
  handler: async (data) => {
    // AI bu fonksiyonu anlar:
    // - Input: { name, email, role }
    // - Output: { success, data } veya { success, errors }
    
    const user = {
      id: Date.now(),
      ...data,
      createdAt: new Date(),
    };
    
    // DB'e kaydet...
    console.log("User created:", user);
    
    return { success: true, data: user };
  },
  
  redirect: "/users",
  successMessage: "Kullanıcı başarıyla oluşturuldu!",
});
