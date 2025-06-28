// 🔧 Temporary placeholder to fix build error

export async function POST(req: Request) {
  return new Response(JSON.stringify({ message: "Checkout placeholder" }), {
    status: 200,
  });
}
