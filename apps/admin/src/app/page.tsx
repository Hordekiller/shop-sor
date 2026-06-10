export default function AdminDashboard() {
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "کل فروش", value: "۰ ریال" },
          { label: "سفارشات امروز", value: "۰" },
          { label: "محصولات", value: "۰" },
          { label: "کاربران", value: "۰" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">آخرین سفارشات</h2>
        <p className="text-gray-500 text-sm">هنوز سفارشی ثبت نشده است.</p>
      </div>
    </>
  );
}
