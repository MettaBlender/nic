import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Überprüfe Anmeldedaten aus .env.local
    if (username === process.env.LOGIN_USERNAME && password === process.env.LOGIN_PASSWORD) {
      const response = NextResponse.json({ success: true });

      // Setze Authentication Cookie (24 Stunden gültig)
      response.cookies.set('nic-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 Stunden
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login Fehler:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Logout: Cookie entfernen
  const response = NextResponse.json({ success: true });
  response.cookies.delete('nic-auth');
  return response;
}
