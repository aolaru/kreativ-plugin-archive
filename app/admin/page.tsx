"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  KeyRound,
  LogOut,
  Plus,
  ShieldCheck,
} from "lucide-react";

type Developer = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  initial_release_year: number | null;
  developers?:
    { name: string; slug: string } | { name: string; slug: string }[] | null;
};
type Notice = { tone: "success" | "error"; message: string } | null;

const productBlank = {
  developerId: "",
  name: "",
  slug: "",
  productType: "",
  status: "active",
  initialReleaseYear: "",
  discontinuedYear: "",
  shortDescription: "",
  overview: "",
  officialUrl: "",
  versionNumber: "",
  versionDate: "",
  versionNotes: "",
  screenshotUrl: "",
  screenshotCaption: "",
  screenshotSourceUrl: "",
  audioTitle: "",
  audioUrl: "",
  audioSourceType: "other_external",
  audioDemoType: "community",
};

function developerName(product: Product) {
  return Array.isArray(product.developers)
    ? product.developers[0]?.name
    : product.developers?.name;
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [developerForm, setDeveloperForm] = useState({
    name: "",
    slug: "",
    country: "",
    foundedYear: "",
    websiteUrl: "",
    description: "",
  });
  const [productForm, setProductForm] = useState(productBlank);

  async function loadCatalog(accessToken: string) {
    const response = await fetch("/api/admin/catalog", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Unable to load editor data.");
    setDevelopers(data.developers ?? []);
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("pluginpedia_admin_token");
    if (!stored) return;
    setToken(stored);
    loadCatalog(stored).catch((error) => {
      window.localStorage.removeItem("pluginpedia_admin_token");
      setToken(null);
      setNotice({ tone: "error", message: error.message });
    });
  }, []);

  async function login(event: FormEvent, action: "sign_in" | "sign_up") {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to continue.");
      if (data.confirmationRequired) {
        setNotice({
          tone: "success",
          message: "Check your inbox to confirm this account, then sign in.",
        });
        return;
      }
      window.localStorage.setItem("pluginpedia_admin_token", data.accessToken);
      setToken(data.accessToken);
      await loadCatalog(data.accessToken);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to continue.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitRecord(event: FormEvent, kind: "developer" | "product") {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setNotice(null);
    try {
      const payload = kind === "developer" ? developerForm : productForm;
      const response = await fetch("/api/admin/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ kind, ...payload }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Unable to save the record.");
      setNotice({
        tone: "success",
        message:
          kind === "developer"
            ? "Developer added to the archive."
            : "Product record and its supplied archive material saved.",
      });
      if (kind === "developer")
        setDeveloperForm({
          name: "",
          slug: "",
          country: "",
          foundedYear: "",
          websiteUrl: "",
          description: "",
        });
      else setProductForm(productBlank);
      await loadCatalog(token);
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to save the record.",
      });
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    window.localStorage.removeItem("pluginpedia_admin_token");
    setToken(null);
    setProducts([]);
    setDevelopers([]);
    setNotice(null);
  }

  if (!token)
    return (
      <main className="admin-shell">
        <header className="admin-header">
          <a className="wordmark" href="/">
            <span className="mark">A</span>
            <span>audioplugin.io</span>
            <small>archive</small>
          </a>
          <a href="/">
            View archive <ArrowRight size={15} />
          </a>
        </header>
        <section className="admin-login">
          <div className="admin-lock">
            <KeyRound size={25} />
          </div>
          <p className="eyebrow">Private workspace</p>
          <h1>Archive editor</h1>
          <p>
            Sign in with the account approved to maintain the audioplugin.io
            catalog.
          </p>
          <form onSubmit={(event) => login(event, "sign_in")}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>
            {notice && (
              <p className={`admin-notice ${notice.tone}`}>{notice.message}</p>
            )}
            <button className="admin-primary" disabled={loading}>
              {loading ? "Please wait…" : "Sign in to editor"}{" "}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="admin-subtle"
              onClick={(event) =>
                login(event as unknown as FormEvent, "sign_up")
              }
              disabled={loading}
            >
              Create a new account
            </button>
          </form>
          <small>
            New accounts need an administrator’s approval before they can edit
            the archive.
          </small>
        </section>
      </main>
    );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="wordmark" href="/">
          <span className="mark">A</span>
          <span>audioplugin.io</span>
          <small>editor</small>
        </a>
        <div>
          <a href="/admin/submissions">Review submissions</a>
          <a href="/" target="_blank" rel="noreferrer">
            View archive <ArrowRight size={15} />
          </a>
          <button onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>
      <section className="admin-intro">
        <div>
          <p className="eyebrow">Private workspace</p>
          <h1>Archive editor</h1>
          <p>
            Add the factual building blocks of audioplugin.io, then publish only
            what you can support with good sources.
          </p>
        </div>
        <div className="admin-safety">
          <ShieldCheck size={18} />
          <span>Editor access verified</span>
        </div>
      </section>
      {notice && (
        <p className={`admin-notice floating ${notice.tone}`}>
          {notice.tone === "success" && <Check size={16} />} {notice.message}
        </p>
      )}
      <section className="admin-workspace">
        <div className="admin-column">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">01 / Developer</p>
              <h2>Add a developer</h2>
            </div>
            <Plus size={19} />
          </div>
          <form
            className="admin-form"
            onSubmit={(event) => submitRecord(event, "developer")}
          >
            <label>
              Name
              <input
                value={developerForm.name}
                onChange={(event) =>
                  setDeveloperForm({
                    ...developerForm,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. Korg"
                required
              />
            </label>
            <label>
              Archive slug{" "}
              <input
                value={developerForm.slug}
                onChange={(event) =>
                  setDeveloperForm({
                    ...developerForm,
                    slug: event.target.value,
                  })
                }
                placeholder="Generated from name if left blank"
              />
            </label>
            <div className="two-inputs">
              <label>
                Founded
                <input
                  type="number"
                  value={developerForm.foundedYear}
                  onChange={(event) =>
                    setDeveloperForm({
                      ...developerForm,
                      foundedYear: event.target.value,
                    })
                  }
                  placeholder="1963"
                  min="1950"
                  max="2100"
                />
              </label>
              <label>
                Country
                <input
                  value={developerForm.country}
                  onChange={(event) =>
                    setDeveloperForm({
                      ...developerForm,
                      country: event.target.value,
                    })
                  }
                  placeholder="Japan"
                />
              </label>
            </div>
            <label>
              Official website
              <input
                type="url"
                value={developerForm.websiteUrl}
                onChange={(event) =>
                  setDeveloperForm({
                    ...developerForm,
                    websiteUrl: event.target.value,
                  })
                }
                placeholder="https://…"
              />
            </label>
            <label>
              Short description
              <textarea
                value={developerForm.description}
                onChange={(event) =>
                  setDeveloperForm({
                    ...developerForm,
                    description: event.target.value,
                  })
                }
                placeholder="What is this developer known for?"
                rows={4}
              />
            </label>
            <button className="admin-primary" disabled={loading}>
              Add developer <ArrowRight size={16} />
            </button>
          </form>
        </div>
        <div className="admin-column wide">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">02 / Record composer</p>
              <h2>Document a product</h2>
            </div>
            <Plus size={19} />
          </div>
          <form
            className="admin-form product-form"
            onSubmit={(event) => submitRecord(event, "product")}
          >
            <div className="two-inputs">
              <label>
                Developer
                <select
                  value={productForm.developerId}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      developerId: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Choose developer</option>
                  {developers.map((developer) => (
                    <option key={developer.id} value={developer.id}>
                      {developer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={productForm.status}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </label>
            </div>
            <div className="two-inputs">
              <label>
                Product name
                <input
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm({ ...productForm, name: event.target.value })
                  }
                  placeholder="e.g. M1"
                  required
                />
              </label>
              <label>
                Type
                <input
                  value={productForm.productType}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      productType: event.target.value,
                    })
                  }
                  placeholder="Workstation synthesizer"
                />
              </label>
            </div>
            <div className="two-inputs">
              <label>
                Initial release year
                <input
                  type="number"
                  value={productForm.initialReleaseYear}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      initialReleaseYear: event.target.value,
                    })
                  }
                  placeholder="1988"
                  min="1950"
                  max="2100"
                />
              </label>
              <label>
                Discontinued year
                <input
                  type="number"
                  value={productForm.discontinuedYear}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      discontinuedYear: event.target.value,
                    })
                  }
                  placeholder="Optional"
                  min="1950"
                  max="2100"
                />
              </label>
            </div>
            <label>
              Short description
              <textarea
                value={productForm.shortDescription}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    shortDescription: event.target.value,
                  })
                }
                placeholder="A concise factual summary."
                rows={3}
              />
            </label>
            <label>
              Archive notes
              <textarea
                value={productForm.overview}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    overview: event.target.value,
                  })
                }
                placeholder="History, context, and notable details."
                rows={4}
              />
            </label>
            <label>
              Official or archived product page
              <input
                type="url"
                value={productForm.officialUrl}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    officialUrl: event.target.value,
                  })
                }
                placeholder="https://…"
              />
            </label>
            <details>
              <summary>Optional version, screenshot, and audio demo</summary>
              <div className="optional-fields">
                <div className="two-inputs">
                  <label>
                    Version number
                    <input
                      value={productForm.versionNumber}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          versionNumber: event.target.value,
                        })
                      }
                      placeholder="1.0"
                    />
                  </label>
                  <label>
                    Release date
                    <input
                      type="date"
                      value={productForm.versionDate}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          versionDate: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  Version notes
                  <textarea
                    value={productForm.versionNotes}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        versionNotes: event.target.value,
                      })
                    }
                    rows={3}
                  />
                </label>
                <label>
                  Screenshot image URL
                  <input
                    type="url"
                    value={productForm.screenshotUrl}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        screenshotUrl: event.target.value,
                      })
                    }
                    placeholder="https://…"
                  />
                </label>
                <div className="two-inputs">
                  <label>
                    Screenshot caption
                    <input
                      value={productForm.screenshotCaption}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          screenshotCaption: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Screenshot source
                    <input
                      type="url"
                      value={productForm.screenshotSourceUrl}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          screenshotSourceUrl: event.target.value,
                        })
                      }
                      placeholder="https://…"
                    />
                  </label>
                </div>
                <div className="two-inputs">
                  <label>
                    Audio demo title
                    <input
                      value={productForm.audioTitle}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          audioTitle: event.target.value,
                        })
                      }
                      placeholder="Factory sounds"
                    />
                  </label>
                  <label>
                    Audio demo URL
                    <input
                      type="url"
                      value={productForm.audioUrl}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          audioUrl: event.target.value,
                        })
                      }
                      placeholder="https://…"
                    />
                  </label>
                </div>
              </div>
            </details>
            <button className="admin-primary" disabled={loading}>
              Save archive record <ArrowRight size={16} />
            </button>
          </form>
        </div>
        <aside className="admin-sidebar">
          <p className="eyebrow">Recent records</p>
          <h2>Catalog activity</h2>
          {products.length ? (
            products.map((product) => (
              <a
                key={product.id}
                href={`/plugin/${developerName(product)?.toLowerCase().replaceAll(" ", "-") ?? "archive"}/${product.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <b>{product.name}</b>
                <span>
                  {developerName(product) ?? "Unknown developer"} ·{" "}
                  {product.initial_release_year ?? "Year unknown"}
                </span>
              </a>
            ))
          ) : (
            <p>No records are available yet.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
