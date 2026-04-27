import { createClient } from "@supabase/supabase-js";

const BUCKET = "documents";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadDocument(
  file: File,
  type: "dni" | "income",
  userId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const key = `${type}/${userId}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await getClient().storage
    .from(BUCKET)
    .upload(key, bytes, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);
  return key;
}

export function getPublicUrl(path: string): string {
  const { data } = getClient().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
