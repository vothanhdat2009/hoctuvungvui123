/* Cấu hình Supabase cho tính năng tài khoản.
   Lấy hai giá trị ở Supabase → Project Settings → API.
   "anon public key" được thiết kế để công khai trên web; dữ liệu được bảo vệ bằng Row Level Security (xem supabase-setup.sql).
   Không bao giờ dán "service_role key" vào đây. */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',
  AUTH_EMAIL_DOMAIN: 'hoctuvung.app'
};
