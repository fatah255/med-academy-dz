// /* scripts/migrate-lessons-to-mux.ts
//    Run:  npx tsx scripts/migrate-lessons-to-mux.ts

import { prisma } from "./lib/db";

//    Required env:
//      AWS_ENDPOINT_URL_S3   (or TIGRIS_ENDPOINT)
//      AWS_ACCESS_KEY_ID     (or TIGRIS_ACCESS_KEY_ID)
//      AWS_SECRET_ACCESS_KEY (or TIGRIS_SECRET_ACCESS_KEY)
//      S3_BUCKET_VIDEOS      (or NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES)
//      MUX_TOKEN_ID
//      MUX_TOKEN_SECRET
// */

// import { prisma } from "@/lib/db";
// // import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
// // import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// // // --- S3/Tigris client (works with either AWS_* or TIGRIS_* envs) ---
// // const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.TIGRIS_ENDPOINT;
// // const accessKeyId =
// //   process.env.AWS_ACCESS_KEY_ID || process.env.TIGRIS_ACCESS_KEY_ID;
// // const secretAccessKey =
// //   process.env.AWS_SECRET_ACCESS_KEY || process.env.TIGRIS_SECRET_ACCESS_KEY;
// // const bucket =
// //   process.env.S3_BUCKET_VIDEOS || process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

// // if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
// //   throw new Error("Missing S3/Tigris env. Check endpoint/keys/bucket.");
// // }

// // const s3 = new S3Client({
// //   region: "auto",
// //   endpoint,
// //   credentials: { accessKeyId, secretAccessKey },
// // });

// // // --- Mux auth ---
// // const MUX_AUTH =
// //   "Basic " +
// //   Buffer.from(
// //     `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
// //   ).toString("base64");

// // type LessonRow = {
// //   id: string;
// //   videoKey: string | null;
// //   muxVideoId: string | null; // we'll store the PLAYBACK ID here
// // };

// // const BATCH_SIZE = 50;
// // const CONCURRENCY = 4;
// // const SIGNED_TTL_SECONDS = 3600;

// // // small helpers
// // function isHttpUrl(s?: string | null) {
// //   return !!s && /^https?:\/\//i.test(s);
// // }

// // async function inputUrlFor(videoKey: string): Promise<string> {
// //   if (isHttpUrl(videoKey)) return videoKey;
// //   return getSignedUrl(
// //     s3,
// //     new GetObjectCommand({ Bucket: bucket!, Key: videoKey }),
// //     { expiresIn: SIGNED_TTL_SECONDS }
// //   );
// // }

// // // --- Mux API helpers ---
// // async function createMuxAsset(inputUrl: string, passthrough: string) {
// //   const res = await fetch("https://api.mux.com/video/v1/assets", {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       Authorization: MUX_AUTH,
// //     },
// //     body: JSON.stringify({
// //       input: inputUrl,
// //       playback_policy: ["public"], // ensures playback_ids are created
// //       mp4_support: "none",
// //       passthrough,
// //     }),
// //   });

// //   const json: any = await res.json();
// //   if (!res.ok) {
// //     throw new Error(`Mux error ${res.status}: ${JSON.stringify(json)}`);
// //   }
// //   return json.data as {
// //     id: string; // ASSET id
// //     status: string;
// //     playback_ids?: { id: string; policy: string }[];
// //   };
// // }

// // async function getMuxAsset(assetId: string) {
// //   const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
// //     headers: { Authorization: MUX_AUTH },
// //   });
// //   const json: any = await res.json();
// //   if (!res.ok) {
// //     throw new Error(
// //       `Mux fetch asset ${assetId} failed: ${JSON.stringify(json)}`
// //     );
// //   }
// //   return json.data as {
// //     id: string;
// //     status: string;
// //     playback_ids?: { id: string; policy: string }[];
// //   };
// // }

// // /** Get playback id, polling briefly if it isn't returned immediately. */
// // async function ensurePlaybackId(asset: {
// //   id: string;
// //   playback_ids?: { id: string }[];
// // }) {
// //   let playbackId = asset.playback_ids?.[0]?.id;
// //   if (playbackId) return { playbackId, assetId: asset.id };

// //   // Rare, but poll for a few seconds if not present yet
// //   for (let i = 0; i < 10 && !playbackId; i++) {
// //     await new Promise((r) => setTimeout(r, 1500));
// //     const fresh = await getMuxAsset(asset.id);
// //     playbackId = fresh.playback_ids?.[0]?.id;
// //   }
// //   if (!playbackId) {
// //     throw new Error(`playback_id still missing for asset ${asset.id}`);
// //   }
// //   return { playbackId, assetId: asset.id };
// // }

// // // --- migration core ---
// // async function migrateBatch(cursor?: string) {
// //   const lessons: LessonRow[] = await prisma.lesson.findMany({
// //     where: {
// //       videoKey: { not: null },
// //       muxVideoId: null, // only those missing a playback id
// //     },
// //     orderBy: { id: "asc" },
// //     ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
// //     take: BATCH_SIZE,
// //     select: { id: true, videoKey: true, muxVideoId: true },
// //   });

// //   if (lessons.length === 0) {
// //     return { count: 0, next: undefined as string | undefined };
// //   }

// //   const groups: LessonRow[][] = [];
// //   for (let i = 0; i < lessons.length; i += CONCURRENCY) {
// //     groups.push(lessons.slice(i, i + CONCURRENCY));
// //   }

// //   let migrated = 0;

// //   for (const group of groups) {
// //     await Promise.all(
// //       group.map(async (l) => {
// //         if (!l.videoKey) return;
// //         try {
// //           const url = await inputUrlFor(l.videoKey);
// //           const asset = await createMuxAsset(url, l.id);
// //           const { playbackId, assetId } = await ensurePlaybackId(asset);

// //           // Store **playback id** in muxVideoId
// //           await prisma.lesson.update({
// //             where: { id: l.id },
// //             data: { muxVideoId: playbackId },
// //           });

// //           migrated++;
// //           console.log(
// //             `✓ ${l.id} -> Mux asset ${assetId}, playback ${playbackId}`
// //           );
// //         } catch (err: any) {
// //           console.error(`✗ ${l.id} failed: ${err?.message || err}`);
// //         }
// //       })
// //     );
// //   }

// //   return { count: migrated, next: lessons[lessons.length - 1].id };
// // }

// // async function main() {
// //   console.log("Starting migration to Mux (storing PLAYBACK IDs) …");
// //   let cursor: string | undefined;
// //   let total = 0;

// //   while (true) {
// //     const { count, next } = await migrateBatch(cursor);
// //     total += count;
// //     if (!next) break;
// //     cursor = next;
// //   }

// //   console.log(`Done. Migrated ${total} lessons to Mux.`);
// //   await prisma.$disconnect();
// // }

// // main().catch((e) => {
// //   console.error(e);
// //   prisma.$disconnect();
// //   process.exit(1);
// // });

// // async function main() {
// //   const email = "derricheomr143@gmail.com";
// //   const user = await prisma.user.findFirst({ where: { email } });
// //   const userId = user?.id;
// //   if (!userId) throw new Error("User not found: " + email);
// //   const level = "THIRD_YEAR";
// //   const quizzes = await prisma.quiz.findMany({
// //     where: { level },
// //     select: { id: true },
// //   });
// //   const quizIds = quizzes.map((q) => q.id);
// //   const date = new Date();
// //   await prisma.$transaction(
// //     quizIds.map((quizId) =>
// //       prisma.enrollment.upsert({
// //         where: { userId_quizId: { userId, quizId } },
// //         update: {
// //           amount: 0,
// //           status: "paid",
// //           isOffer: true,
// //           offer: true,
// //           ai: false,
// //           billingPeriod: "YEARLY" as any, // MONTHLY | YEARLY
// //           months: 12, // 1 or 12
// //           paidAt: date,
// //           expiresAt: null,
// //         },
// //         create: {
// //           userId,
// //           quizId,
// //           amount: 0,
// //           status: "paid",

// //           isOffer: true,
// //           offer: true,
// //           ai: false,
// //           billingPeriod: "YEARLY" as any,
// //           months: 12,
// //           paidAt: date,
// //           expiresAt: null,
// //         },
// //       })
// //     )
// //   );
// // }
// async function main() {
//   const email = "lynachekai05@gmail.com";
//   const user = await prisma.user.findFirst({ where: { email } });
//   const userId = user?.id;
//   if (!userId) throw new Error("User not found: " + email);
//   const courseslug = "HISTO-CARDIO";
//   const course = await prisma.course.findFirst({ where: { slug: courseslug } });
//   const courseId = course?.id;
//   if (!courseId) throw new Error("Course not found: " + courseslug);
//   const enrollment = await prisma.enrollment.findUnique({
//     where: {
//       userId_courseId: {
//         userId,
//         courseId,
//       },
//     },
//   });

//   if (!enrollment) {
//     await prisma.enrollment.create({
//       data: {
//         userId,
//         courseId,
//         amount: course.price,
//         status: "PAID",
//       },
//     });
//   } else if (enrollment.status === "PENDING") {
//     await prisma.enrollment.upsert({
//       where: { userId_courseId: { userId, courseId } },
//       update: {
//         amount: course.price,
//         status: "PAID",
//       },
//       create: {
//         user: { connect: { id: userId } },
//         course: { connect: { id: courseId } },
//         amount: course.price,
//         status: "PAID",
//       },
//     });
//   }
//   console.log("Enrollment updated/created successfully");
// }
// main();
// (async () => {
//   await prisma.enrollment.deleteMany({
//     where: {
//       user: {
//         email: "serineomiri@gmail.com",
//       },
//       // quiz: {
//       //   level: "FIRST_YEAR",
//       // },
//     },
//   });
// })();
async function main() {
  // 1️⃣ Fetch all enrollments with a courseId and paid status
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: { not: null },
      status: { in: ["PAID", "paid"] },
    },
    select: {
      id: true,
      userId: true,
      course: { select: { category: true, level: true } },
    },
  });

  console.log(`Found ${enrollments.length} paid course enrollments.`);

  let createdCount = 0;
  let skippedCount = 0;
  let deletedPending = 0;

  for (const e of enrollments) {
    if (!e.course?.category) continue;
    if (!e.course?.level) continue;

    const { category, level } = e.course;
    console.log(
      `Processing enrollment ${e.id} for user ${e.userId} (${category}, ${level})…`
    );

    // 2️⃣ Find the first quiz with same category and level
    const quiz = await prisma.quiz.findFirst({
      where: { category, level },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!quiz) {
      console.warn(
        `⚠️ No quiz found for category "${category}" at level "${level}"`
      );
      continue;
    }

    // 🧹 2.5️⃣ Delete "PENDING" enrollments for same user & quiz
    const deleted = await prisma.enrollment.deleteMany({
      where: {
        userId: e.userId,
        quizId: quiz.id,
        status: { in: ["PENDING", "pending"] },
      },
    });
    if (deleted.count > 0) {
      deletedPending += deleted.count;
      console.log(
        `🗑️ Deleted ${deleted.count} pending enrollment(s) for user ${e.userId}`
      );
    }

    // 3️⃣ Check if user already has a PAID enrollment
    const existing = await prisma.enrollment.findFirst({
      where: {
        userId: e.userId,
        quizId: quiz.id,
        status: { in: ["PAID", "paid"] },
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // 4️⃣ Create new paid enrollment for that quiz
    await prisma.enrollment.create({
      data: {
        userId: e.userId,
        quizId: quiz.id,
        status: "paid",
        amount: 0,
      },
    });

    createdCount++;
  }

  console.log(`✅ Created ${createdCount} new quiz enrollments`);
  console.log(`🗑️ Deleted ${deletedPending} pending duplicates`);
  console.log(`⏭️ Skipped ${skippedCount} already existing paid ones`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
