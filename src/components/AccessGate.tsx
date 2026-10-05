import { useState, type FormEvent } from "react";
import { getAccessCode, setAccessCode } from "../lib/api";

export function AccessGate({ onSubmit }: { onSubmit: () => void }) {
  const [code, setCode] = useState("");
  const retried = getAccessCode() !== "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setAccessCode(code.trim());
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm rounded-card bg-white p-6 text-center shadow-card">
      <h2 className="text-lg font-extrabold text-purple-600">Nhập mã truy cập</h2>
      <p className="mt-1 text-sm text-grey-600">Bảng xếp hạng chỉ dành cho nội bộ. Vui lòng nhập mã do BTC cung cấp.</p>
      <label className="mt-4 block text-left">
        <span className="text-sm font-semibold">Mã truy cập</span>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          required
          aria-invalid={retried}
          aria-describedby={retried ? "gate-error" : undefined}
          className="mt-1 w-full rounded-xl border border-purple-600/30 px-3 py-2.5"
        />
      </label>
      {retried && (
        <p id="gate-error" role="alert" className="mt-2 text-left text-sm font-medium text-orange-800">
          Mã chưa đúng. Vui lòng thử lại.
        </p>
      )}
      <button type="submit" className="mt-4 w-full rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">
        Xem bảng xếp hạng
      </button>
    </form>
  );
}
