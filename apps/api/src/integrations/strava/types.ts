export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: "Bearer";
  scope?: string;
  athlete?: StravaAthlete;
}

export interface StravaAthlete {
  id: number;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  city?: string | null;
  country?: string | null;
  profile?: string | null;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date: string;
  start_date_local: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  start_latlng?: [number, number] | null;
  end_latlng?: [number, number] | null;
}

export interface StateClaims {
  sub: string;
  kind: "strava_oauth";
  nonce: string;
}
