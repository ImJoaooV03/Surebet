import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vdypfimrcxhgxwypreyz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeXBmaW1yY3hoZ3h3eXByZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjEwNDQsImV4cCI6MjA4NDUzNzA0NH0.bGMBlb8SKAlXd2ez88amt2ZcFdGcIqpxC-cSCQkg8nI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log("Criando usuário admin...");
  
  const { data, error } = await supabase.auth.signUp({
    email: 'joaovicrengel@gmail.com',
    password: 'Acesso4321@@',
    options: {
      data: { full_name: 'Admin' }
    }
  });

  if (error) {
    console.error("Erro ao criar usuário:", error.message);
  } else {
    console.log("Usuário criado/verificado com sucesso:", data.user?.email);
    console.log("NOTA: Se a confirmação de e-mail estiver ativada no seu projeto Supabase, você precisará confirmar o e-mail antes de fazer login.");
  }
}

createAdmin();
