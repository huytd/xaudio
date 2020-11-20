use std::{collections::HashMap, process::Command};

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchEntry {
    #[serde(rename = "upload_date")]
    pub upload_date: String,
    pub duration: f64,
    pub fulltitle: String,
    pub id: String,
    pub title: String,
    #[serde(rename = "average_rating")]
    pub average_rating: f64,
    #[serde(rename = "webpage_url_basename")]
    pub webpage_url_basename: String,
    pub acodec: String,
    #[serde(rename = "display_id")]
    pub display_id: String,
    pub uploader: String,
    #[serde(rename = "uploader_id")]
    pub uploader_id: String,
    pub thumbnails: Vec<Thumbnail>,
    pub thumbnail: String,
    #[serde(rename = "channel_id")]
    pub channel_id: String,
    #[serde(rename = "webpage_url")]
    pub webpage_url: String,
    #[serde(rename = "n_entries")]
    pub n_entries: i64,
    #[serde(rename = "age_limit")]
    pub age_limit: i64,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Thumbnail {
    pub url: String,
    pub width: i64,
    pub resolution: String,
    pub id: String,
    pub height: i64,
}

fn stringify_error(e: impl std::fmt::Debug + std::fmt::Display) -> String {
    format!("{}", e)
}

pub fn search_song(input: &str, limit: usize) -> Result<Vec<SearchEntry>, String> {
    let search_limit = if limit > 0 {
        limit.to_string()
    } else {
        format!("all")
    };
    let output = Command::new("youtube-dl")
        .arg("-j")
        .arg(format!("ytsearch{}:{}", search_limit, input))
        .output()
        .map_err(stringify_error)?;
    let stdout = String::from_utf8(output.stdout).map_err(stringify_error)?;
    let json = format!("[{}]", stdout.replace("}\n{", "},\n{"));
    let parsed = serde_json::from_str::<Vec<SearchEntry>>(&json).map_err(stringify_error)?;
    Ok(parsed)
}

pub fn get_song_url(id: &str) -> Result<String, String> {
    let url = format!("https://youtube.com/watch?v={}", id);
    let output = Command::new("youtube-dl")
    .arg("--get-url")
    .arg("--extract-audio")
    .arg("--audio-format=mp3")
    .arg("--audio-quality=0")
    .arg(url)
    .output()
    .map_err(stringify_error)?;
    let stdout = String::from_utf8(output.stdout).map_err(stringify_error)?;
    Ok(stdout.replace("\n", ""))
}