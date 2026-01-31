// frontend/src/app/backoffice/page.tsx
"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import BackofficeModal from "../components/BackofficeModal";
import { isBackofficeEnabled } from "../lib/backoffice";
import { clearAuthTokens } from "./logic";
import AuthAlert from "./components/AuthAlert";
import DisabledView from "./components/DisabledView";
import MessageModal from "./components/MessageModal";
import MessagesTable from "./components/MessagesTable";
import ReferencesManager from "./components/ReferencesManager";
import Sidebar from "./components/Sidebar";
import StatusBlocks from "./components/StatusBlocks";
import UndoToast from "./components/UndoToast";
import { useBackofficeMessages } from "./useBackofficeMessages";
import {
  getBackofficeSection,
  getBackofficeSectionServer,
  setBackofficeSection,
  subscribeBackofficeSection,
} from "./sectionStore";

export default function BackofficePage() {
  const router = useRouter();
  const backofficeEnabled = isBackofficeEnabled();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const section = useSyncExternalStore(
    subscribeBackofficeSection,
    getBackofficeSection,
    getBackofficeSectionServer,
  );

  const {
    openLogin,
    setOpenLogin,
    status,
    errorMsg,
    authMsg,
    selected,
    setSelected,
    page,
    setPage,
    query,
    selectedIds,
    undoIds,
    totalCount,
    totalPages,
    visibleItems,
    load,
    toggleSelected,
    changeSort,
    getSortArrow,
    deleteSelected,
    undoDelete,
    closeLoginModal,
    onSearchChange,
  } = useBackofficeMessages({
    apiBase,
    backofficeEnabled,
    routerPush: router.push,
  });

  function goHome() {
    router.push("/");
  }

  function logoutAndGoHome() {
    clearAuthTokens();
    router.push("/");
  }

  if (!backofficeEnabled) {
    return <DisabledView onGoHome={goHome} />;
  }

  return (
    <main className="h-screen overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="flex h-full">
        <Sidebar
          section={section}
          onSelectSection={setBackofficeSection}
          onGoHome={goHome}
          onRefresh={() => load(page)}
          onLogout={logoutAndGoHome}
        />

        <section className="flex min-w-0 flex-1 flex-col px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {section === "references" ? "Références" : "Messages de contact"}
              </h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                {section === "references"
                  ? "Gestion des références visibles sur le site."
                  : "Vue condensée des messages les plus récents."}
              </p>
            </div>
          </div>

          {section === "messages" ? (
            <>
              <div className="mt-6">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => onSearchChange(e.currentTarget.value)}
                  placeholder="Rechercher par nom, email ou sujet"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-400
                             dark:border-neutral-800 dark:bg-neutral-950"
                />
              </div>

              <AuthAlert
                message={authMsg}
                onReconnect={() => setOpenLogin(true)}
                onGoHome={logoutAndGoHome}
              />

              <div className="mt-6 flex-1">
                <StatusBlocks status={status} errorMsg={errorMsg} itemsLength={visibleItems.length} />

                <MessagesTable
                  items={visibleItems}
                  selectedIds={selectedIds}
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  onToggleSelected={toggleSelected}
                  onSelectMessage={setSelected}
                  onDeleteSelected={deleteSelected}
                  onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
                  onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
                  onSetPage={setPage}
                  onChangeSort={changeSort}
                  getSortArrow={getSortArrow}
                />
              </div>
            </>
          ) : null}

          {section === "references" ? (
            <ReferencesManager apiBase={apiBase} onRequestLogin={() => setOpenLogin(true)} />
          ) : null}
        </section>
      </div>

      <BackofficeModal open={openLogin} onClose={closeLoginModal} />

      <UndoToast undoCount={undoIds?.length ?? 0} onUndo={undoDelete} />

      <MessageModal message={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
