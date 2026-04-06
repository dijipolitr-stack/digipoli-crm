// app/page.tsx — Kök sayfa, dashboard'a yönlendirir
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
