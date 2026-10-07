import Image from "next/image";
import { API_BASE_URL } from "@/config/api";

const members = [
  {
    studentID: "22521508",
    name: "Võ Ngọc Bảo Trân",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  },
  {
    studentID: "22520047",
    name: "Lê Ngọc Kiều Anh",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    studentID: "22521106",
    name: "Trần Hoài Phú",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    studentID: "22520937",
    name: "Trần Thư Ngân",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
  },
];

export default function Members() {
  return (
    <div
      id="members"
      className="relative isolate overflow-hidden bg-transparent py-24 sm:py-48"
    >
      <Image
        alt=""
        src={`${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-y=.8&w=2830&h=1500&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
        )}`}
        className="absolute inset-0 -z-10 size-full object-cover object-right md:object-center"
        width={500}
        height={500}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Thành viên nhóm
          </h2>
          <p className="mt-8 text-lg font-medium text-gray-300 sm:text-xl/8">
            Đội ngũ phát triển Explavue - Hệ thống gợi ý lịch trình thông minh
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {members.map((member) => (
              <div
                key={member.studentID}
                className="flex flex-col items-center text-center group"
              >
                {/* Avatar */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FFD700] shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src={`${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(
                        member.avatar
                      )}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      width={500}
                      height={500}
                    />
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute -inset-2 rounded-full border-2 border-[#FFD700] opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                </div>

                {/* Member Info */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white group-hover:text-[#FFD700] transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-300 font-mono">
                    {member.studentID}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
