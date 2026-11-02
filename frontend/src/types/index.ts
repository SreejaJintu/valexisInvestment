export interface UserProfile {
  userId: number;
  publicId: string;
  username: string;
  email: string;
  role: 'User' | 'Admin';
  referralCode: string;
  sponsorUsername?: string;
  currentRank: string;
  lockedPrincipal: number;
  activeGrowth: number;
  spotRewards: number;
  referralCommissions: number;
  withdrawableBalance: number;
  totalWithdrawn: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

export interface NotificationItem {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface InvestmentSettingDto {
  SettingId?: number;
  Category: string;
  DailyRoiRate: number;
  CapMultiplier: number;
  MinInvestmentAmount: number;
  MaxInvestmentAmount: number;
  SpotRewardRate: number;
  DepositWalletAddress: string;
  SupportedNetwork: string;
  MinWithdrawalAmount?: number;
  WithdrawalFeeRate?: number;
  RoiExecutionHourUtc?: number;
}

export interface InvestmentRequestResponseDto {
  requestId: number;
  publicId: string;
  userId: number;
  username: string;
  userEmail: string;
  category: string;
  amount: number;
  token: string;
  network: string;
  transactionHash: string;
  paymentProofUrl?: string;
  status: string;
  rejectionReason?: string;
  reviewedByAdminUsername?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface InvestmentDto {
  investmentId: number;
  publicId: string;
  userId: number;
  username: string;
  principalAmount: number;
  dailyRoiRate: number;
  capMultiplier: number;
  maxEarningsCap: number;
  totalRoiEarned: number;
  status: string;
  isTradeCapitalReward: boolean;
  createdAt: string;
  maturedAt?: string;
}

export interface DailyRoiTransactionDto {
  dailyRoiId: number;
  investmentId: number;
  principalAmount: number;
  roiRate: number;
  roiAmount: number;
  calculationDate: string;
  status: string;
  processedAt: string;
}

export interface ReferralCommissionDto {
  commissionId: number;
  sourceUsername: string;
  level: number;
  commissionRate: number;
  baseDailyRoiAmount: number;
  commissionAmount: number;
  createdAt: string;
}

export interface SpotRewardDto {
  spotRewardId: number;
  sourceUsername: string;
  baseInvestmentAmount: number;
  spotRate: number;
  rewardAmount: number;
  createdAt: string;
}

export interface ReferralMemberDto {
  userId: number;
  username: string;
  email: string;
  level: number;
  currentRank: string;
  totalInvested: number;
  joinedAt: string;
}

export interface WithdrawalRequestDto {
  withdrawalId: number;
  publicId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  destinationAddress: string;
  network: string;
  status: string;
  transactionHash?: string;
  rejectionReason?: string;
  createdAt: string;
  paidAt?: string;
}

export interface RankSettingDto {
  rankId: number;
  rankCode: string;
  rankName: string;
  requiredSelfInvestment: number;
  requiredTeamBusiness: number;
  requiredLeadersCount: number;
  tradeCapitalReward: number;
}

export interface RankRewardDto {
  rewardId: number;
  rankCode: string;
  rankName: string;
  tradeCapitalAmount: number;
  status: string;
  createdAt: string;
}

export interface LedgerEntryDto {
  ledgerId: number;
  transactionType: string;
  entryType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  targetBalanceType: string;
  description: string;
  createdAt: string;
}

export interface AdminUserDto {
  userId: number;
  username: string;
  email: string;
  role: string;
  referralCode: string;
  currentRank: string;
  lockedPrincipal: number;
  activeGrowth: number;
  withdrawableBalance: number;
  spotRewards: number;
  referralCommissions: number;
  totalWithdrawn: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralSettingDto {
  level1Rate: number;
  level2Rate: number;
  level3Rate: number;
  level4Rate: number;
  level5Rate: number;
}
