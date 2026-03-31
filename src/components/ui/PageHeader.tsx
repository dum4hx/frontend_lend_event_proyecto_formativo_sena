/**
 * PageHeader — Standardised page header with title, subtitle, and action area.
 *
 * Keeps every /app page visually consistent without repeating layout markup.
 */

import React from "react";

export interface PageHeaderProps {
  /** Page title (rendered as an h1). */
  title: string;
  /** Optional gold-highlighted suffix appended to the title. */
  titleAccent?: string;
  /** Optional subtitle / description below the title. */
  subtitle?: string;
  /** Right-hand side actions (buttons, stats, etc.). */
  actions?: React.ReactNode;
  /** Extra class names on the root wrapper. */
  className?: string;
}

export function PageHeader({
  title,
  titleAccent,
  subtitle,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${className}`}>
      <div>
        <h1 className="section-title">
          {title}
          {titleAccent && <span className="text-[#FFD700]"> {titleAccent}</span>}
        </h1>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
