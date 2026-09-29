/* Cấu hình Supabase cho tính năng tài khoản.
   Lấy hai giá trị ở Supabase → Project Settings → API.
   "anon public key" được thiết kế để công khai trên web; dữ liệu được bảo vệ bằng Row Level Security (xem supabase-setup.sql).
   Không bao giờ dán "service_role key" vào đây. */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://ctmdftrezimtfkmpljmz.supabase.co/rest/v1/',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bWRmdHJlemltdGZrbXBsam16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Njc1MjEsImV4cCI6MjEwNjI0MzUyMX0.1xhpEa067bJ365cpQbB5cUOQjlKLiAFKwrLxF2_pWwo
',
  AUTH_EMAIL_DOMAIN: 'hoctuvung.app'
};
