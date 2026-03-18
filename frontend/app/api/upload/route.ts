import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sanitizeDocumentSlug, sanitizeResourceKey } from "@/lib/sanitizer";

/**
 * R2 配置
 * Cloudflare R2 兼容 S3 API，使用 AWS SDK 连接
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface UploadRequest {
  filename: string;
  contentType: string;
  articleSlug: string;
}

/**
 * @description POST /api/upload - 生成 R2 预签名 URL，用于客户端直接上传图片
 * @param request - NextRequest 对象，请求体包含以下字段：
 *   - filename: 文件名
 *   - contentType: 文件 MIME 类型
 *   - articleSlug: 文章 slug（用于组织文件路径）
 * @returns NextResponse - 返回 JSON 对象：
 *   - uploadUrl: 预签名上传 URL（用于 PUT 请求）
 *   - publicUrl: 图片的公开访问 URL
 *   - key: R2 对象键
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 验证环境变量
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME ||
      !process.env.R2_PUBLIC_URL
    ) {
      console.error("R2 环境变量未配置");
      return NextResponse.json(
        { error: "服务器配置错误：R2 未配置" },
        { status: 500 },
      );
    }

    // 解析请求体
    const body = (await request.json()) as UploadRequest;
    const { filename, contentType, articleSlug } = body;

    // 验证请求参数
    if (!filename || !contentType || !articleSlug) {
      return NextResponse.json(
        { error: "缺少必要参数：filename, contentType, articleSlug" },
        { status: 400 },
      );
    }

    // 验证文件类型
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "仅支持图片类型文件" },
        { status: 400 },
      );
    }

    // 生成唯一的对象键
    // 格式：users/{userId}/{article-slug}/{timestamp}-{filename}
    const timestamp = Date.now();
    const userId = session.user.id;
    const sanitizedSlug = sanitizeDocumentSlug(articleSlug);
    const sanitizedFilename = sanitizeResourceKey(filename);
    const key = `users/${userId}/${sanitizedSlug}/${timestamp}-${sanitizedFilename}`;

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // 生成预签名 URL（15 分钟有效期）
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 900,
    });

    // 生成公开访问 URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("生成预签名 URL 失败:", error);
    return NextResponse.json(
      {
        error: "生成上传链接失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
