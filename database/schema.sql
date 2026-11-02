-- ============================================================================
-- VALEXIS PLATFORM - PRODUCTION MS SQL SERVER DATABASE SCHEMA
-- Compatible with SQL Server 2019 / 2022 / Azure SQL
-- Financial Precision: DECIMAL(18, 8) for USDT calculations
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ValexisDb')
BEGIN
    CREATE DATABASE ValexisDb;
END
GO

USE ValexisDb;
GO

-- ============================================================================
-- 1. USERS & ROLES
-- ============================================================================

IF OBJECT_ID('dbo.UserRoles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRoles (
        RoleId INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        RoleId INT NOT NULL CONSTRAINT FK_Users_UserRoles REFERENCES dbo.UserRoles(RoleId),
        ReferralCode NVARCHAR(20) NOT NULL UNIQUE,
        ReferredByUserId BIGINT NULL CONSTRAINT FK_Users_ReferredBy REFERENCES dbo.Users(UserId),
        CurrentRankId INT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active', 'Suspended', 'PendingVerification'
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        UpdatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE NONCLUSTERED INDEX IX_Users_ReferredBy ON dbo.Users(ReferredByUserId);
    CREATE NONCLUSTERED INDEX IX_Users_ReferralCode ON dbo.Users(ReferralCode);
END
GO

-- ============================================================================
-- 2. USER WALLETS (Real-time financial state with optimistic concurrency)
-- ============================================================================

IF OBJECT_ID('dbo.UserWallets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserWallets (
        UserId BIGINT PRIMARY KEY CONSTRAINT FK_UserWallets_Users REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        LockedPrincipal DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        ActiveInvestmentGrowth DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        SpotRewardBalance DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        ReferralCommissionBalance DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        WithdrawableBalance DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        ReservedWithdrawalBalance DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        TotalWithdrawn DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        RowVersion ROWVERSION NOT NULL
    );
END
GO

-- ============================================================================
-- 3. INVESTMENT SETTINGS & PLANS
-- ============================================================================

IF OBJECT_ID('dbo.InvestmentSettings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.InvestmentSettings (
        SettingId INT IDENTITY(1,1) PRIMARY KEY,
        Category NVARCHAR(50) NOT NULL DEFAULT 'Crypto',
        DailyRoiRate DECIMAL(5, 4) NOT NULL DEFAULT 0.0080, -- 0.8%
        CapMultiplier DECIMAL(4, 2) NOT NULL DEFAULT 3.00,  -- 3x
        MinInvestmentAmount DECIMAL(18, 8) NOT NULL DEFAULT 50.00000000,
        MaxInvestmentAmount DECIMAL(18, 8) NOT NULL DEFAULT 100000.00000000,
        SpotRewardRate DECIMAL(5, 4) NOT NULL DEFAULT 0.0500, -- 5%
        MinWithdrawalAmount DECIMAL(18, 8) NOT NULL DEFAULT 20.00000000,
        WithdrawalFeeRate DECIMAL(5, 4) NOT NULL DEFAULT 0.0500, -- 5%
        DepositWalletAddress NVARCHAR(200) NOT NULL DEFAULT 'TValexisOfficialDepositAddressTRC20xxxx',
        SupportedNetwork NVARCHAR(50) NOT NULL DEFAULT 'USDT-TRC20',
        RoiExecutionHourUtc INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        UpdatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- ============================================================================
-- 4. INVESTMENT REQUESTS (Deposits pending verification)
-- ============================================================================

IF OBJECT_ID('dbo.InvestmentRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.InvestmentRequests (
        RequestId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,
        UserId BIGINT NOT NULL CONSTRAINT FK_InvRequests_Users REFERENCES dbo.Users(UserId),
        Category NVARCHAR(50) NOT NULL DEFAULT 'Crypto',
        Amount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_InvRequest_Amount CHECK (Amount > 0),
        Token NVARCHAR(20) NOT NULL DEFAULT 'USDT',
        Network NVARCHAR(50) NOT NULL DEFAULT 'TRC20',
        TransactionHash NVARCHAR(150) NOT NULL,
        PaymentProofUrl NVARCHAR(500) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
        RejectionReason NVARCHAR(500) NULL,
        ReviewedByAdminId BIGINT NULL CONSTRAINT FK_InvRequests_Admin REFERENCES dbo.Users(UserId),
        ReviewedAt DATETIMEOFFSET NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    -- Prevent duplicate transaction hash reuse across the entire system
    CREATE UNIQUE NONCLUSTERED INDEX UQ_InvestmentRequests_TxHash 
    ON dbo.InvestmentRequests(TransactionHash) 
    WHERE Status IN ('Pending', 'Approved');

    CREATE NONCLUSTERED INDEX IX_InvestmentRequests_UserStatus 
    ON dbo.InvestmentRequests(UserId, Status);
END
GO

-- ============================================================================
-- 5. INVESTMENTS (Approved & Active Investment Cycles)
-- ============================================================================

IF OBJECT_ID('dbo.Investments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Investments (
        InvestmentId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,
        UserId BIGINT NOT NULL CONSTRAINT FK_Investments_Users REFERENCES dbo.Users(UserId),
        RequestId BIGINT NULL CONSTRAINT FK_Investments_Request REFERENCES dbo.InvestmentRequests(RequestId),
        PrincipalAmount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_Inv_Principal CHECK (PrincipalAmount > 0),
        DailyRoiRate DECIMAL(5, 4) NOT NULL,
        CapMultiplier DECIMAL(4, 2) NOT NULL DEFAULT 3.00,
        MaxEarningsCap DECIMAL(18, 8) NOT NULL, -- PrincipalAmount * CapMultiplier
        TotalRoiEarned DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active', 'Matured', 'Cancelled'
        IsTradeCapitalReward BIT NOT NULL DEFAULT 0,  -- 1 if funded via Rank Claim
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        MaturedAt DATETIMEOFFSET NULL
    );
    CREATE NONCLUSTERED INDEX IX_Investments_User_Status ON dbo.Investments(UserId, Status);
    CREATE NONCLUSTERED INDEX IX_Investments_Active ON dbo.Investments(Status) WHERE Status = 'Active';
END
GO

-- ============================================================================
-- 6. DAILY ROI TRANSACTIONS (Accrual ledger for daily yields)
-- ============================================================================

IF OBJECT_ID('dbo.DailyROITransactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DailyROITransactions (
        DailyRoiId BIGINT IDENTITY(1,1) PRIMARY KEY,
        InvestmentId BIGINT NOT NULL CONSTRAINT FK_DailyRoi_Investment REFERENCES dbo.Investments(InvestmentId),
        UserId BIGINT NOT NULL CONSTRAINT FK_DailyRoi_User REFERENCES dbo.Users(UserId),
        PrincipalAmount DECIMAL(18, 8) NOT NULL,
        RoiRate DECIMAL(5, 4) NOT NULL,
        RoiAmount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_DailyRoi_Amount CHECK (RoiAmount >= 0),
        CalculationDate DATE NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Processed', -- 'Processed', 'Failed'
        ErrorMessage NVARCHAR(500) NULL,
        ProcessedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    -- Enforce idempotency: One ROI credit per investment per calendar day
    CREATE UNIQUE NONCLUSTERED INDEX UQ_DailyRoi_Investment_Date 
    ON dbo.DailyROITransactions(InvestmentId, CalculationDate);

    CREATE NONCLUSTERED INDEX IX_DailyRoi_User_Date ON dbo.DailyROITransactions(UserId, CalculationDate);
END
GO

-- ============================================================================
-- 7. REFERRAL RELATIONSHIPS (Multi-tier hierarchy independent of investments)
-- ============================================================================

IF OBJECT_ID('dbo.ReferralRelationships', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ReferralRelationships (
        RelationshipId BIGINT IDENTITY(1,1) PRIMARY KEY,
        AncestorUserId BIGINT NOT NULL CONSTRAINT FK_RefRel_Ancestor REFERENCES dbo.Users(UserId),
        DescendantUserId BIGINT NOT NULL CONSTRAINT FK_RefRel_Descendant REFERENCES dbo.Users(UserId),
        DepthLevel INT NOT NULL CONSTRAINT CHK_RefRel_Depth CHECK (DepthLevel BETWEEN 1 AND 5),
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Referral_Ancestor_Descendant 
    ON dbo.ReferralRelationships(AncestorUserId, DescendantUserId);

    CREATE NONCLUSTERED INDEX IX_Referral_Descendant 
    ON dbo.ReferralRelationships(DescendantUserId, DepthLevel);
END
GO

-- ============================================================================
-- 8. REFERRAL COMMISSIONS (Calculated on Downline Daily ROI)
-- ============================================================================

IF OBJECT_ID('dbo.ReferralCommissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ReferralCommissions (
        CommissionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        BeneficiaryUserId BIGINT NOT NULL CONSTRAINT FK_RefComm_Beneficiary REFERENCES dbo.Users(UserId),
        SourceUserId BIGINT NOT NULL CONSTRAINT FK_RefComm_Source REFERENCES dbo.Users(UserId),
        SourceInvestmentId BIGINT NOT NULL CONSTRAINT FK_RefComm_Investment REFERENCES dbo.Investments(InvestmentId),
        DailyRoiTxId BIGINT NOT NULL CONSTRAINT FK_RefComm_DailyRoi REFERENCES dbo.DailyROITransactions(DailyRoiId),
        Level INT NOT NULL CONSTRAINT CHK_RefComm_Level CHECK (Level BETWEEN 1 AND 5),
        CommissionRate DECIMAL(5, 4) NOT NULL, -- e.g. 0.15 for Level 1
        BaseDailyRoiAmount DECIMAL(18, 8) NOT NULL,
        CommissionAmount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_RefComm_Amount CHECK (CommissionAmount >= 0),
        Status NVARCHAR(20) NOT NULL DEFAULT 'Processed',
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    -- Enforce idempotency: Commission paid only once per daily ROI tx per beneficiary
    CREATE UNIQUE NONCLUSTERED INDEX UQ_RefComm_Roi_Beneficiary 
    ON dbo.ReferralCommissions(DailyRoiTxId, BeneficiaryUserId);

    CREATE NONCLUSTERED INDEX IX_RefComm_Beneficiary ON dbo.ReferralCommissions(BeneficiaryUserId);
END
GO

-- ============================================================================
-- 9. SPOT REWARDS (Separate one-time rewards on downline investments)
-- ============================================================================

IF OBJECT_ID('dbo.SpotRewards', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpotRewards (
        SpotRewardId BIGINT IDENTITY(1,1) PRIMARY KEY,
        BeneficiaryUserId BIGINT NOT NULL CONSTRAINT FK_SpotReward_Beneficiary REFERENCES dbo.Users(UserId),
        SourceUserId BIGINT NOT NULL CONSTRAINT FK_SpotReward_Source REFERENCES dbo.Users(UserId),
        InvestmentId BIGINT NOT NULL CONSTRAINT FK_SpotReward_Investment REFERENCES dbo.Investments(InvestmentId),
        SpotRate DECIMAL(5, 4) NOT NULL,
        BaseInvestmentAmount DECIMAL(18, 8) NOT NULL,
        RewardAmount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_SpotReward_Amount CHECK (RewardAmount >= 0),
        Status NVARCHAR(20) NOT NULL DEFAULT 'Processed',
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    -- Enforce idempotency: Exactly one spot reward per investment
    CREATE UNIQUE NONCLUSTERED INDEX UQ_SpotReward_Investment 
    ON dbo.SpotRewards(InvestmentId);

    CREATE NONCLUSTERED INDEX IX_SpotRewards_Beneficiary ON dbo.SpotRewards(BeneficiaryUserId);
END
GO

-- ============================================================================
-- 10. WITHDRAWAL REQUESTS (Payouts)
-- ============================================================================

IF OBJECT_ID('dbo.WithdrawalRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WithdrawalRequests (
        WithdrawalId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,
        UserId BIGINT NOT NULL CONSTRAINT FK_Withdrawals_Users REFERENCES dbo.Users(UserId),
        RequestedAmount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_Withdrawal_Amount CHECK (RequestedAmount > 0),
        FeeAmount DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        NetAmount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_Withdrawal_Net CHECK (NetAmount > 0),
        DestinationAddress NVARCHAR(200) NOT NULL,
        Network NVARCHAR(50) NOT NULL DEFAULT 'USDT-TRC20',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Paid', 'Rejected'
        TransactionHash NVARCHAR(150) NULL,
        RejectionReason NVARCHAR(500) NULL,
        ReviewedByAdminId BIGINT NULL CONSTRAINT FK_Withdrawals_Admin REFERENCES dbo.Users(UserId),
        ReviewedAt DATETIMEOFFSET NULL,
        PaidAt DATETIMEOFFSET NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE NONCLUSTERED INDEX IX_WithdrawalRequests_User_Status 
    ON dbo.WithdrawalRequests(UserId, Status);
END
GO

-- ============================================================================
-- 11. FINANCIAL LEDGER (Double-Entry Audit Record)
-- ============================================================================

IF OBJECT_ID('dbo.FinancialLedger', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FinancialLedger (
        LedgerId BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId BIGINT NOT NULL CONSTRAINT FK_Ledger_Users REFERENCES dbo.Users(UserId),
        TransactionType NVARCHAR(50) NOT NULL, 
        -- 'DepositApproved', 'PrincipalLocked', 'DailyRoi', 'ReferralCommission', 
        -- 'SpotReward', 'RankRewardClaimed', 'WithdrawalReserved', 'WithdrawalPaid', 'WithdrawalRefunded'
        EntryType NVARCHAR(10) NOT NULL, -- 'Credit', 'Debit'
        Amount DECIMAL(18, 8) NOT NULL CONSTRAINT CHK_Ledger_Amount CHECK (Amount > 0),
        BalanceBefore DECIMAL(18, 8) NOT NULL,
        BalanceAfter DECIMAL(18, 8) NOT NULL,
        TargetBalanceType NVARCHAR(50) NOT NULL, 
        -- 'LockedPrincipal', 'ActiveInvestmentGrowth', 'SpotRewardBalance', 'ReferralCommissionBalance', 'WithdrawableBalance'
        ReferenceId BIGINT NULL, -- Foreign key reference to specific request or claim
        Description NVARCHAR(500) NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE NONCLUSTERED INDEX IX_FinancialLedger_User_Date 
    ON dbo.FinancialLedger(UserId, CreatedAt);
END
GO

-- ============================================================================
-- 12. RANK SETTINGS (R1 - R8 Specifications)
-- ============================================================================

IF OBJECT_ID('dbo.RankSettings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RankSettings (
        RankId INT IDENTITY(1,1) PRIMARY KEY,
        RankCode NVARCHAR(10) NOT NULL UNIQUE, -- 'R1', 'R2', ... 'R8'
        RankName NVARCHAR(50) NOT NULL,
        RequiredSelfInvestment DECIMAL(18, 8) NOT NULL,
        RequiredTeamBusiness DECIMAL(18, 8) NOT NULL,
        RequiredLeadersCount INT NOT NULL DEFAULT 0,
        RequiredLeaderRankId INT NULL CONSTRAINT FK_RankSettings_LeaderRank REFERENCES dbo.RankSettings(RankId),
        TradeCapitalReward DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
        IsLifetime BIT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- ============================================================================
-- 13. USER RANK HISTORY
-- ============================================================================

IF OBJECT_ID('dbo.UserRankHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRankHistory (
        HistoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId BIGINT NOT NULL CONSTRAINT FK_RankHistory_Users REFERENCES dbo.Users(UserId),
        RankId INT NOT NULL CONSTRAINT FK_RankHistory_Rank REFERENCES dbo.RankSettings(RankId),
        AchievedSelfInvestment DECIMAL(18, 8) NOT NULL,
        AchievedTeamBusiness DECIMAL(18, 8) NOT NULL,
        AchievedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_UserRankHistory_User_Rank 
    ON dbo.UserRankHistory(UserId, RankId);
END
GO

-- ============================================================================
-- 14. RANK REWARDS & 15. RANK REWARD CLAIMS
-- ============================================================================

IF OBJECT_ID('dbo.RankRewards', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RankRewards (
        RewardId BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId BIGINT NOT NULL CONSTRAINT FK_RankRewards_User REFERENCES dbo.Users(UserId),
        RankId INT NOT NULL CONSTRAINT FK_RankRewards_Rank REFERENCES dbo.RankSettings(RankId),
        TradeCapitalAmount DECIMAL(18, 8) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Eligible', -- 'Eligible', 'Claimed', 'Expired'
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_RankRewards_User_Rank 
    ON dbo.RankRewards(UserId, RankId);
END
GO

IF OBJECT_ID('dbo.RankRewardClaims', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RankRewardClaims (
        ClaimId BIGINT IDENTITY(1,1) PRIMARY KEY,
        RewardId BIGINT NOT NULL CONSTRAINT FK_RankClaims_Reward REFERENCES dbo.RankRewards(RewardId),
        UserId BIGINT NOT NULL CONSTRAINT FK_RankClaims_User REFERENCES dbo.Users(UserId),
        ResultingInvestmentId BIGINT NOT NULL CONSTRAINT FK_RankClaims_Investment REFERENCES dbo.Investments(InvestmentId),
        ClaimedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_RankRewardClaims_Reward 
    ON dbo.RankRewardClaims(RewardId);
END
GO

-- ============================================================================
-- 16. NOTIFICATIONS
-- ============================================================================

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationId BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId BIGINT NOT NULL CONSTRAINT FK_Notifications_User REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        Title NVARCHAR(150) NOT NULL,
        Message NVARCHAR(1000) NOT NULL,
        Type NVARCHAR(50) NOT NULL DEFAULT 'Info', -- 'Info', 'Success', 'Warning', 'Payout', 'Deposit'
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE NONCLUSTERED INDEX IX_Notifications_User_Read 
    ON dbo.Notifications(UserId, IsRead);
END
GO

-- ============================================================================
-- 17. ADMIN AUDIT LOGS
-- ============================================================================

IF OBJECT_ID('dbo.AdminAuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdminAuditLogs (
        AuditLogId BIGINT IDENTITY(1,1) PRIMARY KEY,
        AdminUserId BIGINT NOT NULL CONSTRAINT FK_Audit_Admin REFERENCES dbo.Users(UserId),
        Action NVARCHAR(100) NOT NULL,
        TargetEntity NVARCHAR(100) NOT NULL,
        TargetId BIGINT NULL,
        Details NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(50) NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    CREATE NONCLUSTERED INDEX IX_AdminAuditLogs_Admin_Action 
    ON dbo.AdminAuditLogs(AdminUserId, Action, CreatedAt);
END
GO

-- ============================================================================
-- 18. INITIAL SEED DATA
-- ============================================================================

-- Roles
IF NOT EXISTS (SELECT 1 FROM dbo.UserRoles WHERE RoleName = 'Admin')
    INSERT INTO dbo.UserRoles (RoleName, Description) VALUES ('Admin', 'Platform Administrator');

IF NOT EXISTS (SELECT 1 FROM dbo.UserRoles WHERE RoleName = 'User')
    INSERT INTO dbo.UserRoles (RoleName, Description) VALUES ('User', 'Standard Investor');

-- Default Investment & Platform Settings
IF NOT EXISTS (SELECT 1 FROM dbo.InvestmentSettings WHERE Category = 'Crypto')
BEGIN
    INSERT INTO dbo.InvestmentSettings 
    (Category, DailyRoiRate, CapMultiplier, MinInvestmentAmount, MaxInvestmentAmount, SpotRewardRate, MinWithdrawalAmount, WithdrawalFeeRate, DepositWalletAddress, SupportedNetwork)
    VALUES 
    ('Crypto', 0.0080, 3.00, 50.00000000, 100000.00000000, 0.0500, 20.00000000, 0.0500, 'TValexisOfficialDepositAddressTRC20xxxx', 'USDT-TRC20');
END

-- Seed R1 - R8 Rank Rules
IF NOT EXISTS (SELECT 1 FROM dbo.RankSettings WHERE RankCode = 'R1')
BEGIN
    INSERT INTO dbo.RankSettings (RankCode, RankName, RequiredSelfInvestment, RequiredTeamBusiness, RequiredLeadersCount, TradeCapitalReward)
    VALUES 
    ('R1', 'Associate Leader', 100.00000000, 5000.00000000, 0, 150.00000000),
    ('R2', 'Executive Leader', 250.00000000, 15000.00000000, 2, 500.00000000),
    ('R3', 'Senior Executive', 500.00000000, 45000.00000000, 2, 1500.00000000),
    ('R4', 'Regional Director', 1000.00000000, 120000.00000000, 3, 4000.00000000),
    ('R5', 'Managing Director', 2500.00000000, 300000.00000000, 3, 10000.00000000),
    ('R6', 'Vice President', 5000.00000000, 800000.00000000, 3, 25000.00000000),
    ('R7', 'Senior VP', 10000.00000000, 2000000.00000000, 4, 60000.00000000),
    ('R8', 'Crown Ambassador', 25000.00000000, 5000000.00000000, 4, 150000.00000000);
END
GO
