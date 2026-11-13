import { Component, useEffect, useState, type ReactNode } from "react";
import { GarajEkrani } from "../features/garaj";
import { dexieAracRepository, type AracRepository } from "../storage";
import { kaliciDepolamaIste } from "./kalici-depolama";
import { simdi, yeniId } from "./saat";

const BEKLENMEYEN_HATA = "Beklenmeyen bir hata oluştu. Sayfayı yenileyin.";

/** docs/conventions.md, Error handling: unexpected errors show a generic message, never details. */
class HataSiniri extends Component<{ children: ReactNode }, { hata: boolean }> {
  override state = { hata: false };

  static getDerivedStateFromError() {
    return { hata: true };
  }

  override render() {
    return this.state.hata ? <p role="alert">{BEKLENMEYEN_HATA}</p> : this.props.children;
  }
}

type Props = { repository?: AracRepository };

export function App({ repository }: Props) {
  const [repo] = useState(() => repository ?? dexieAracRepository());

  useEffect(() => {
    void kaliciDepolamaIste();
  }, []);

  return (
    <HataSiniri>
      <main>
        <GarajEkrani repository={repo} simdi={simdi} yeniId={yeniId} />
      </main>
    </HataSiniri>
  );
}
