// File: database/seed.ts

import fs from "fs";
import path from "path";
import ImageKit from "imagekit";
// Perhatikan nama properti di sini: coverUrl, coverColor, dst. (camelCase)

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { books } from "./schema";

config({ path: ".env.local" });

const jsonPath = path.join(process.cwd(), "dummybooks.json");
const fileContent = fs.readFileSync(jsonPath, "utf-8");
const dummyBooks = JSON.parse(fileContent);

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

const uploadToImageKit = async (
  url: string,
  fileName: string,
  folder: string
) => {
  try {
    const response = await imagekit.upload({ file: url, fileName, folder });
    return response.filePath;
  } catch (error) {
    console.error("Error uploading image to ImageKit:", error);
  }
};

const seed = async () => {
  console.log("Seeding data...");
  try {
    if (!Array.isArray(dummyBooks)) {
      throw new Error("dummybooks.json is not a valid JSON array.");
    }
    for (const book of dummyBooks) {
      console.log(`Processing book: ${book.title}`);

      const coverUrlFromKit = (await uploadToImageKit(
        book.coverUrl,
        `${book.title}.jpg`,
        "/books/covers"
      )) as string;
      const videoUrlFromKit = (await uploadToImageKit(
        book.videoUrl,
        `${book.title}.mp4`,
        "/books/videos"
      )) as string;

      // ======================= PERUBAHAN DI SINI =======================
      // Ubah semua properti menjadi camelCase agar cocok dengan skema Drizzle
      await db.insert(books).values({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        rating: book.rating,
        summary: book.summary,
        description: book.description,
        coverUrl: coverUrlFromKit, // <= Diubah dari cover_url
        videoUrl: videoUrlFromKit, // <= Diubah dari video_url
        coverColor: book.coverColor, // <= Diubah dari cover_color
        totalCopies: book.totalCopies, // <= Diubah dari total_copies
        availableCopies: book.availableCopies, // <= Diubah dari available_copies
      });
      // =================================================================
    }
    console.log("Data seeded successfully!");
    console.log("Seeding finished.");
    process.exit(0); // Tambahkan ini untuk memastikan skrip berhenti setelah selesai
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1); // Tambahkan ini untuk keluar dengan kode error
  }
};

seed();
