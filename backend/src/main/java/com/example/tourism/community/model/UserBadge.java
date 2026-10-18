package com.example.tourism.community.model;

import java.time.LocalDateTime;

public class UserBadge {
    private Long id;
    private Long userId;
    private String badgeCode;
    private String badgeName;
    private String badgeDescription;
    private String badgeIconUrl;
    private LocalDateTime unlockedAt;

    public UserBadge() {}

    public UserBadge(Long id, Long userId, String badgeCode, String badgeName, String badgeDescription, String badgeIconUrl, LocalDateTime unlockedAt) {
        this.id = id;
        this.userId = userId;
        this.badgeCode = badgeCode;
        this.badgeName = badgeName;
        this.badgeDescription = badgeDescription;
        this.badgeIconUrl = badgeIconUrl;
        this.unlockedAt = unlockedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getBadgeCode() { return badgeCode; }
    public void setBadgeCode(String badgeCode) { this.badgeCode = badgeCode; }

    public String getBadgeName() { return badgeName; }
    public void setBadgeName(String badgeName) { this.badgeName = badgeName; }

    public String getBadgeDescription() { return badgeDescription; }
    public void setBadgeDescription(String badgeDescription) { this.badgeDescription = badgeDescription; }

    public String getBadgeIconUrl() { return badgeIconUrl; }
    public void setBadgeIconUrl(String badgeIconUrl) { this.badgeIconUrl = badgeIconUrl; }

    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
}

