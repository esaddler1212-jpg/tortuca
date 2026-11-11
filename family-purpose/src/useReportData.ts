import { useEffect, useState } from "react";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { buildBackup } from "./backup";
import { fetchMergedReportData } from "./reportData";

export interface ReportDataState {
  checkIns: CheckIn[];
  sessions: GroupSession[];
  loading: boolean;
  cloudIncluded: boolean;
  hint?: string;
}

function localReportState(settings: DebriefSettings): ReportDataState {
  const local = buildBackup();
  const willFetch = settings.backupUploadUrl.trim().length > 0;
  return {
    checkIns: local.checkIns,
    sessions: local.groupSessions,
    loading: willFetch,
    cloudIncluded: false,
  };
}

/**
 * Merges this device with cloud uploads for debrief / weekly / reports only.
 * Refetch when settings or local data revision changes.
 */
export function useReportData(
  settings: DebriefSettings,
  dataRevision: number,
): ReportDataState {
  const [state, setState] = useState<ReportDataState>(() =>
    localReportState(settings),
  );

  useEffect(() => {
    const willFetch = settings.backupUploadUrl.trim().length > 0;
    if (willFetch) {
      setState((prev) => ({ ...prev, loading: true }));
    } else {
      setState(localReportState(settings));
    }

    let cancelled = false;

    void fetchMergedReportData(settings).then((result) => {
      if (cancelled) return;
      setState({
        checkIns: result.checkIns,
        sessions: result.sessions,
        loading: false,
        cloudIncluded: result.cloudIncluded,
        hint: result.error,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    settings.backupUploadUrl,
    settings.backupUploadKey,
    settings.deviceLabel,
    dataRevision,
  ]);

  return state;
}
