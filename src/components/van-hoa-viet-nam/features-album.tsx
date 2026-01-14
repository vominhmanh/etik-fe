"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import TestimonialImg from "@/images/a.jpg";
// import Swiper core and required modules
import { Navigation, Pagination, A11y } from 'swiper/modules';
import Feature1 from "@/images/tinh_nang_1.png";
import Feature2 from "@/images/tinh_nang_2.png";
import Feature3 from "@/images/tinh_nang_3.png";
import Feature4 from "@/images/tinh_nang_4.png";
import Feature5 from "@/images/tinh_nang_5.png";
import CustomerMixiCup from "@/images/customer-mixicup.jpg";
import CustomerRefundMeeting from "@/images/customer-refund-meeting.png";
import CustomerGeforce from "@/images/customer-geforce-fans-party.jpg";
import { useTranslation } from '@/contexts/locale-context';
import { Heart, Trophy, Star, Users, HandHeart } from '@phosphor-icons/react/dist/ssr';
import axios from 'axios';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

interface Player {
  id: number;
  name: string;
  description: string;
  nomineeId: number;
  categoryId: number;
  stats: {
    wins: number;
    rating: number;
    fans: number;
    votes: number;
  };
}

const PLAYERS: Player[] = [
  {
    id: 1,
    name: "Himass",
    description: "Chuyên gia điều phối đội hình, kỹ năng chiến thuật xuất sắc và khả năng đọc game siêu việt",
    nomineeId: 1,
    categoryId: 2,
    stats: { wins: 45, rating: 9.8, fans: 12500, votes: 3420 },
  },
  {
    id: 2,
    name: "TanVuu",
    description: "Sniper huyền thoại với độ chính xác cực cao, từng dẫn dắt đội giành nhiều giải thưởng lớn",
    nomineeId: 2,
    categoryId: 2,
    stats: { wins: 52, rating: 9.9, fans: 18200, votes: 4890 },
  },
  {
    id: 3,
    name: "Sololzy",
    description: "Tactical mastermind với phong cách chơi thông minh, luôn biết cách tận dụng mọi tình huống",
    nomineeId: 3,
    categoryId: 2,
    stats: { wins: 38, rating: 9.6, fans: 9800, votes: 2150 },
  },
  {
    id: 4,
    name: "Delwyn",
    description: "All-rounder đa năng, xuất sắc ở mọi vị trí và luôn giữ được phong độ ổn định trong các giải đấu",
    nomineeId: 4,
    categoryId: 2,
    stats: { wins: 41, rating: 9.7, fans: 11200, votes: 2870 },
  },
];

const getInitials = (name: string) => {
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (index: number) => {
  const colors = [
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-orange-500 to-orange-600",
  ];
  return colors[index % colors.length];
};

interface VoteItem {
  id: number;
  eventId: number;
  categoryId: number;
  nomineeId: number;
  createdAt: string;
}

interface VoteListResponse {
  votes: VoteItem[];
}

interface NomineeVoteCount {
  nomineeId: number;
  voteCount: number;
}

interface NomineeVoteCountResponse {
  voteCounts: NomineeVoteCount[];
}

export default function FeaturesAlbum() {
  const { tt } = useTranslation();
  const [votingStates, setVotingStates] = useState<Record<number, { loading: boolean; voted: boolean }>>({});
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});

  // Fetch vote counts on mount
  useEffect(() => {
    const fetchVoteCounts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
        // Get category_id from first player (assuming all players are in the same category)
        const categoryId = PLAYERS[0]?.categoryId;
        if (!categoryId) return;

        const response = await axios.get<NomineeVoteCountResponse>(
          `${apiUrl}/mini-app-voting/51/nominees-vote-counts?category_id=${categoryId}`
        );

        if (response.data && response.data.voteCounts) {
          const countsMap: Record<number, number> = {};
          response.data.voteCounts.forEach((item) => {
            countsMap[item.nomineeId] = item.voteCount;
          });
          setVoteCounts(countsMap);
        }
      } catch (error: any) {
        console.error("Error fetching vote counts:", error);
        // If error, continue with empty counts
      }
    };

    fetchVoteCounts();
  }, []);

  // Fetch user's votes on mount
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setIsLoadingVotes(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
        const response = await axios.get<VoteListResponse>(
          `${apiUrl}/mini-app-voting/51/my-votes`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.data && response.data.votes) {
          // Initialize voting states based on fetched votes
          const initialStates: Record<number, { loading: boolean; voted: boolean }> = {};
          
          PLAYERS.forEach((player) => {
            const hasVoted = response.data.votes.some(
              (vote) => 
                vote.categoryId === player.categoryId && 
                vote.nomineeId === player.nomineeId
            );
            initialStates[player.id] = { loading: false, voted: hasVoted };
          });

          setVotingStates(initialStates);
        }
      } catch (error: any) {
        console.error("Error fetching votes:", error);
        // If error, just continue with empty states
      } finally {
        setIsLoadingVotes(false);
      }
    };

    fetchVotes();
  }, []);

  const handleVote = async (player: Player) => {
    if (votingStates[player.id]?.voted || votingStates[player.id]?.loading) return;

    setVotingStates((prev) => ({
      ...prev,
      [player.id]: { loading: true, voted: false },
    }));

    try {
      // Get access token from localStorage (SSO login)
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        alert("Vui lòng đăng nhập để bình chọn");
        setVotingStates((prev) => ({
          ...prev,
          [player.id]: { loading: false, voted: false },
        }));
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
      const response = await axios.post(
        `${apiUrl}/mini-app-voting/51/vote`,
        {
          category_id: player.categoryId,
          nominee_id: player.nomineeId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setVotingStates((prev => ({
          ...prev,
          [player.id]: { loading: false, voted: true },
        })));
        
        // Refresh vote counts after successful vote
        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
        try {
          const voteCountsResponse = await axios.get<NomineeVoteCountResponse>(
            `${apiUrl}/mini-app-voting/51/nominees-vote-counts?category_id=${player.categoryId}`
          );
          if (voteCountsResponse.data && voteCountsResponse.data.voteCounts) {
            const countsMap: Record<number, number> = {};
            voteCountsResponse.data.voteCounts.forEach((item) => {
              countsMap[item.nomineeId] = item.voteCount;
            });
            setVoteCounts(countsMap);
          }
        } catch (error) {
          console.error("Error refreshing vote counts:", error);
          // Fallback: update local count
          setVoteCounts((prev) => ({
            ...prev,
            [player.nomineeId]: (prev[player.nomineeId] || 0) + 1,
          }));
        }
      } else {
        throw new Error(response.data?.message || "Có lỗi xảy ra khi bình chọn");
      }
    } catch (error: any) {
      console.error("Error voting:", error);
      const errorMessage = 
        error?.response?.data?.detail || 
        error?.response?.data?.message || 
        error?.message || 
        "Có lỗi xảy ra khi bình chọn";
      
      setVotingStates((prev) => ({
        ...prev,
        [player.id]: { loading: false, voted: false },
      }));
      alert(errorMessage);
    }
  };

  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="space-y-3 text-center">
            <h2 className="mb-6 border-y text-3xl font-bold text-gray-700 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.700/.7),transparent)1] md:mb-12 md:text-4xl">
              {tt("Tuyển thủ của năm", "Best Players of the Year")}
            </h2>
            <Swiper
              modules={[Navigation, Pagination, A11y]}
              slidesPerView={1}
              navigation
              loop={true}
              className="!pb-12"
            >
              {PLAYERS.map((player, index) => {
                const votingState = votingStates[player.id] || { loading: false, voted: false };
                return (
                  <SwiperSlide key={player.id}>
                    <div className="mx-auto max-w-md">
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-xl transition-all hover:shadow-2xl">
                        {/* Player Card */}
                        <div className="flex flex-col items-center space-y-4">
                          {/* Avatar */}
                          <div
                            className={`flex h-24 w-24 items-center justify-center rounded-full ${getAvatarColor(
                              index
                            )} text-3xl font-bold text-white shadow-lg`}
                          >
                            {getInitials(player.name)}
                          </div>

                          {/* Player Name */}
                          <h3 className="text-xl font-bold text-gray-800">{player.name}</h3>

                          {/* Description */}
                          <p className="text-xs text-center text-gray-600 leading-relaxed px-2">
                            {player.description}
                          </p>

                          {/* Stats */}
                          <div className="grid w-full grid-cols-4 gap-2">
                            <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                              <Trophy className="mb-1 h-4 w-4 text-yellow-500" weight="fill" />
                              <span className="text-xs font-semibold text-gray-700">
                                {player.stats.wins}
                              </span>
                              <span className="text-[10px] text-gray-500">Wins</span>
                            </div>
                            <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                              <Star className="mb-1 h-4 w-4 text-blue-500" weight="fill" />
                              <span className="text-xs font-semibold text-gray-700">
                                {player.stats.rating}
                              </span>
                              <span className="text-[10px] text-gray-500">Rating</span>
                            </div>
                            <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                              <Users className="mb-1 h-4 w-4 text-pink-500" weight="fill" />
                              <span className="text-xs font-semibold text-gray-700">
                                {(player.stats.fans / 1000).toFixed(1)}K
                              </span>
                              <span className="text-[10px] text-gray-500">Fans</span>
                            </div>
                            <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                              <HandHeart className="mb-1 h-4 w-4 text-red-500" weight="fill" />
                              <span className="text-xs font-semibold text-gray-700">
                                {(() => {
                                  const voteCount = voteCounts[player.nomineeId] !== undefined 
                                    ? voteCounts[player.nomineeId] 
                                    : player.stats.votes;
                                  return voteCount >= 1000 
                                    ? (voteCount / 1000).toFixed(1) + 'K'
                                    : voteCount.toString();
                                })()}
                              </span>
                              <span className="text-[10px] text-gray-500">Votes</span>
                            </div>
                          </div>

                          {/* Vote Button */}
                          <button
                            onClick={() => handleVote(player)}
                            disabled={votingState.loading || votingState.voted}
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                              votingState.voted
                                ? "bg-green-500 text-white"
                                : "bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600"
                            } ${votingState.loading ? "cursor-not-allowed opacity-50" : "hover:scale-105"} shadow-lg`}
                          >
                            {votingState.loading ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span className="text-sm">Đang bình chọn...</span>
                              </>
                            ) : votingState.voted ? (
                              <>
                                <Heart className="h-5 w-5" weight="fill" />
                                <span className="text-sm">Đã bình chọn</span>
                              </>
                            ) : (
                              <>
                                <Heart className="h-5 w-5" />
                                <span className="text-sm">Bình chọn</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </div>
      <span id="create-your-event" style={{marginTop: '-40px'}}></span>
    </section>
  );
}
