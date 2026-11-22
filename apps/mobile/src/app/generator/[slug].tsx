import { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Mail, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { sendVerificationEmail, verifyEmail } from "../../lib/api";
import { useHistoryStore } from "../../features/history/history-store";

export default function GeneratorScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [email, setEmail] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [step, setStep] = useState<"email" | "sent" | "pending" | "done">("email");
  const [loading, setLoading] = useState(false);
  const addItem = useHistoryStore(s => s.addItem);
  const title = useMemo(() => slug === "am-generator" ? "Alight Motion Generator" : "Generator", [slug]);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit(action: "send" | "verify") {
    if (!validEmail || loading) return;
    if (action === "verify" && !/^https:\/\//i.test(magicLink.trim())) { Alert.alert("Magic link belum valid", "Tempel tautan HTTPS lengkap dari email Alight Motion."); return; }
    setLoading(true);
    try {
      const result = action === "send" ? await sendVerificationEmail(email.trim()) : await verifyEmail(email.trim(), magicLink.trim());
      addItem({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, email: email.trim(), action, status: "success", verification: result.status, message: result.message, createdAt: new Date().toISOString() });
      if (action === "send") setStep("sent"); else { setStep(result.status === "completed" ? "done" : "pending"); }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      addItem({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, email: email.trim(), action, status: "failed", message, createdAt: new Date().toISOString() });
      Alert.alert("Permintaan gagal", message);
    } finally { setLoading(false); }
  }

  return <Screen>
    <Stack.Screen options={{ title, headerShown: true, headerTitleStyle: { fontWeight: "800" }, headerBackTitle: "Kembali" }} />
    <View className="mb-5"><Text className="text-xs font-bold uppercase tracking-widest text-brand-teal">AM API SERVICE • ALIGHT MOTION</Text><Text className="mt-2 text-3xl font-extrabold text-light-text dark:text-dark-text">{step === "done" ? "Verifikasi selesai" : step === "pending" ? "Verifikasi belum selesai" : step === "sent" ? "Periksa email" : "Aktivasi melalui email"}</Text><Text className="mt-2 text-sm leading-6 text-light-muted dark:text-dark-muted">{step === "email" ? "Masukkan email yang akan menerima tautan verifikasi Alight Motion." : step === "sent" ? `Email verifikasi dikirim ke ${email}. Periksa inbox dan folder spam sebelum melanjutkan.` : step === "pending" ? "Tempel tautan magic link dari email Alight Motion untuk menyelesaikan verifikasi." : "Magic link telah diproses oleh provider."}</Text></View>
    <Card className="mb-5">
      <View className="mb-4 flex-row items-center gap-3"><View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FCE7EF] dark:bg-[#49303F]"><Mail color="#D95F7C" size={22}/></View><View className="flex-1"><Text className="text-base font-extrabold text-light-text dark:text-dark-text">Email verifikasi</Text><Text className="text-xs text-light-muted dark:text-dark-muted">Pastikan alamat email benar</Text></View></View>
      <TextInput value={email} onChangeText={setEmail} editable={step === "email"} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="nama@email.com" placeholderTextColor="#99949D" className="h-14 rounded-2xl border border-[#EEE9DF] bg-[#FFFCF5] px-4 text-base text-light-text dark:border-[#3B3D4A] dark:bg-[#303342] dark:text-dark-text" />
      {step === "email" ? <View className="mt-4"><PrimaryButton title="Kirim email verifikasi" loading={loading} onPress={() => void submit("send")}/></View> : null}
    </Card>
    {step === "sent" || step === "pending" ? <Card className="mb-5"><View className="flex-row items-center gap-3"><ShieldCheck color="#278F7D" size={25}/><Text className="flex-1 text-base font-extrabold text-light-text dark:text-dark-text">Sudah memeriksa email?</Text></View><Text className="my-3 text-sm leading-6 text-light-muted dark:text-dark-muted">Buka email dari Alight Motion, salin seluruh tautan magic link, lalu tempel di kolom berikut. DockKey mengirim tautan itu ke provider untuk diverifikasi.</Text><TextInput value={magicLink} onChangeText={setMagicLink} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://..." placeholderTextColor="#99949D" className="h-14 rounded-2xl border border-[#EEE9DF] bg-[#FFFCF5] px-4 text-sm text-light-text dark:border-[#3B3D4A] dark:bg-[#303342] dark:text-dark-text"/><PrimaryButton title="Verifikasi magic link" loading={loading} onPress={() => void submit("verify")}/><Pressable onPress={() => { setMagicLink(""); setStep("email"); }} className="mt-4 items-center py-2"><Text className="text-sm font-bold text-brand-teal">Gunakan email lain</Text></Pressable></Card> : null}
    {step === "done" ? <Card className="items-center py-8"><CheckCircle2 color="#278F7D" size={48}/><Text className="mt-3 text-xl font-extrabold text-light-text dark:text-dark-text">Hasil verifikasi tersedia</Text><Text className="mt-2 text-center text-sm leading-6 text-light-muted dark:text-dark-muted">Provider menerima dan memproses magic link. DockKey tidak menyimpan atau menampilkan token sesi provider.</Text><Pressable onPress={() => { setEmail(""); setMagicLink(""); setStep("email"); }} className="mt-5 rounded-2xl bg-[#E4F3EE] px-5 py-3 dark:bg-[#25443D]"><Text className="font-bold text-brand-teal">Buat permintaan baru</Text></Pressable></Card> : null}
    <View className="mt-5 flex-row items-start gap-2"><ArrowLeft size={16} color="#8B8992"/><Text className="flex-1 text-xs leading-5 text-light-muted dark:text-dark-muted">DockKey tidak meminta password email. Magic link bersifat pribadi; jangan bagikan kepada orang lain.</Text></View>
  </Screen>;
}
